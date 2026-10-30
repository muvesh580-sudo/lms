import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongo;
let app;
let User;
let setRazorpayClient;
let uploadDir;

const tokens = {};
const ids = {};

const auth = (who) => ({ Authorization: `Bearer ${tokens[who]}` });

const register = async (who, extra = {}) => {
  const res = await request(app)
    .post('/api/users/register')
    .send({ name: who, email: `${who}@test.dev`, password: 'secret123', ...extra });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  tokens[who] = res.body.token;
  ids[who] = res.body._id;
  return res;
};

const setRole = async (who, role) => {
  await User.updateOne({ _id: ids[who] }, { role });
};

before(async () => {
  uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lms-uploads-'));
  mongo = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongo.getUri();
  process.env.JWT_SECRET = 'test-secret';
  process.env.RAZORPAY_KEY_ID = 'rzp_test_dummy';
  process.env.RAZORPAY_KEY_SECRET = 'razorpay-test-secret';
  process.env.UPLOAD_DIR = uploadDir;
  process.env.AUTH_RATE_LIMIT = '1000';
  process.env.CONTACT_RATE_LIMIT = '50';
  process.env.NODE_ENV = 'test';

  ({ default: app } = await import('../app.js'));
  ({ default: User } = await import('../models/userModel.js'));
  ({ setRazorpayClient } = await import('../controllers/paymentController.js'));

  let orderCount = 0;
  setRazorpayClient({
    orders: {
      create: async ({ amount, currency }) => ({ id: `order_${++orderCount}`, amount, currency }),
    },
  });

  await mongoose.connect(process.env.MONGO_URI);
  await User.init();

  await register('admin');
  await setRole('admin', 'admin');
  await register('teacher');
  await setRole('teacher', 'instructor');
  await register('otherteacher');
  await setRole('otherteacher', 'instructor');
  await register('student');
  await register('student2');
});

after(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
  fs.rmSync(uploadDir, { recursive: true, force: true });
});

describe('authentication', () => {
  test('registration ignores a requested role', async () => {
    const res = await register('sneaky', { role: 'admin' });
    assert.equal(res.body.role, 'student');
  });

  test('login succeeds with correct password and fails otherwise', async () => {
    const ok = await request(app)
      .post('/api/users/login')
      .send({ email: 'STUDENT@test.dev', password: 'secret123' });
    assert.equal(ok.status, 200);
    assert.ok(ok.body.token);

    const bad = await request(app)
      .post('/api/users/login')
      .send({ email: 'student@test.dev', password: 'wrong-password' });
    assert.equal(bad.status, 401);
  });

  test('login rejects NoSQL operator injection', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: { $ne: null }, password: { $ne: null } });
    assert.equal(res.status, 400);
  });

  test('accepts emails with long TLDs and plus aliases, rejects malformed ones', async () => {
    const ok = await request(app)
      .post('/api/users/register')
      .send({ name: 'Plus', email: 'first.last+lms@school.info', password: 'secret123' });
    assert.equal(ok.status, 201);
    const bad = await request(app)
      .post('/api/users/register')
      .send({ name: 'Bad', email: 'not-an-email', password: 'secret123' });
    assert.equal(bad.status, 400);
  });

  test('missing registration fields return 400, not 500', async () => {
    const res = await request(app).post('/api/users/register').send({ email: 'x@test.dev' });
    assert.equal(res.status, 400);
  });

  test('malformed Authorization header returns a single 401', async () => {
    const res = await request(app).get('/api/users/profile').set('Authorization', 'Bearer');
    assert.equal(res.status, 401);
    const bad = await request(app).get('/api/users/profile').set('Authorization', 'Bearer abc.def.ghi');
    assert.equal(bad.status, 401);
  });

  test('saving a user without changing the password keeps the login working', async () => {
    const res = await request(app)
      .put('/api/users/profile')
      .set(auth('student2'))
      .send({ name: 'Renamed Student', role: 'admin' });
    assert.equal(res.status, 200);
    assert.equal(res.body.role, 'student', 'role must not be changeable via profile');

    const login = await request(app)
      .post('/api/users/login')
      .send({ email: 'student2@test.dev', password: 'secret123' });
    assert.equal(login.status, 200, 'password hash must not be re-hashed on save');
  });

  test('profile responses never include the password hash', async () => {
    const res = await request(app).get('/api/users').set(auth('admin'));
    assert.equal(res.status, 200);
    assert.ok(res.body.users.length >= 5);
    assert.ok(res.body.users.every((u) => u.password === undefined));
  });
});

describe('role-based access', () => {
  test('students cannot use admin endpoints', async () => {
    for (const url of ['/api/users', '/api/payments/admin', '/api/courses/admin/courses']) {
      const res = await request(app).get(url).set(auth('student'));
      assert.equal(res.status, 403, url);
    }
  });

  test('admin payment list is reachable (route order)', async () => {
    const res = await request(app).get('/api/payments/admin').set(auth('admin'));
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
  });

  test('students cannot create courses', async () => {
    const res = await request(app).post('/api/courses').set(auth('student')).send({});
    assert.equal(res.status, 403);
  });

  test('admin cannot delete or demote themselves', async () => {
    const del = await request(app).delete(`/api/users/${ids.admin}`).set(auth('admin'));
    assert.equal(del.status, 400);
    const demote = await request(app)
      .put(`/api/users/${ids.admin}`)
      .set(auth('admin'))
      .send({ role: 'student' });
    assert.equal(demote.status, 400);
  });
});

describe('courses and lectures', () => {
  const course = {
    title: 'Node Basics',
    description: 'Learn Node',
    price: 499,
    category: 'Web Development',
    level: 'Beginner',
    duration: '4 weeks',
  };

  test('invalid course data returns 400 with a validation message', async () => {
    const res = await request(app)
      .post('/api/courses')
      .set(auth('teacher'))
      .send({ title: 'Missing fields' });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /description/i);
  });

  test('instructor creates paid and free courses', async () => {
    const paid = await request(app).post('/api/courses').set(auth('teacher')).send(course);
    assert.equal(paid.status, 201);
    ids.paidCourse = paid.body._id;

    const free = await request(app)
      .post('/api/courses')
      .set(auth('teacher'))
      .send({ ...course, title: 'Free Intro', price: 0 });
    assert.equal(free.status, 201);
    ids.freeCourse = free.body._id;
  });

  test('unpublished course is hidden from the public but visible to its instructor', async () => {
    const anon = await request(app).get(`/api/courses/${ids.paidCourse}`);
    assert.equal(anon.status, 401);
    const other = await request(app).get(`/api/courses/${ids.paidCourse}`).set(auth('student'));
    assert.equal(other.status, 403);
    const owner = await request(app).get(`/api/courses/${ids.paidCourse}`).set(auth('teacher'));
    assert.equal(owner.status, 200);
    assert.equal(owner.body.canManage, true);
  });

  test('another instructor cannot edit or delete the course', async () => {
    const put = await request(app)
      .put(`/api/courses/${ids.paidCourse}`)
      .set(auth('otherteacher'))
      .send({ title: 'Hijacked' });
    assert.equal(put.status, 403);
    const del = await request(app).delete(`/api/courses/${ids.paidCourse}`).set(auth('otherteacher'));
    assert.equal(del.status, 403);
  });

  test('instructor adds a preview and a locked lecture with a video upload', async () => {
    for (const [title, order, isPreview] of [
      ['Preview lecture', 1, 'true'],
      ['Locked lecture', 2, 'false'],
    ]) {
      for (const courseKey of ['paidCourse', 'freeCourse']) {
        const res = await request(app)
          .post('/api/lectures')
          .set(auth('teacher'))
          .field('title', title)
          .field('description', 'desc')
          .field('course', ids[courseKey])
          .field('duration', '10')
          .field('order', String(order))
          .field('isPreview', isPreview)
          .attach('video', Buffer.from('fake video bytes'), 'clip.mp4');
        assert.equal(res.status, 201, JSON.stringify(res.body));
        assert.equal(res.body.videoUrl, undefined, 'stored file name must not be exposed');
        if (courseKey === 'paidCourse') ids[order === 1 ? 'previewLecture' : 'lockedLecture'] = res.body._id;
      }
    }
  });

  test('rejects uploads with a disallowed file type', async () => {
    const res = await request(app)
      .post('/api/lectures')
      .set(auth('teacher'))
      .field('course', ids.paidCourse)
      .attach('video', Buffer.from('<script>'), 'evil.html');
    assert.equal(res.status, 400);
  });

  test('instructor can publish and set a free price of 0', async () => {
    const pub = await request(app)
      .put(`/api/courses/${ids.paidCourse}`)
      .set(auth('teacher'))
      .send({ published: 'true' });
    assert.equal(pub.status, 200);
    assert.equal(pub.body.published, true);

    const free = await request(app)
      .put(`/api/courses/${ids.freeCourse}`)
      .set(auth('teacher'))
      .send({ published: true, price: 0 });
    assert.equal(free.body.price, 0);
  });

  test('course listing filters safely and hides enrolled students', async () => {
    const list = await request(app).get('/api/courses?keyword=node.*(');
    assert.equal(list.status, 200);

    const injected = await request(app).get('/api/courses?category[$ne]=x');
    assert.equal(injected.status, 200);
    assert.equal(injected.body.count, 2, 'operator object must be ignored, not applied');

    const all = await request(app).get('/api/courses?keyword=node');
    assert.equal(all.body.count, 1);
    assert.equal(all.body.courses[0].enrolledStudents, undefined);
  });

  test('public course details do not leak locked lecture files', async () => {
    const res = await request(app).get(`/api/courses/${ids.paidCourse}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.isEnrolled, false);
    const locked = res.body.lectures.find((l) => l.title === 'Locked lecture');
    const preview = res.body.lectures.find((l) => l.title === 'Preview lecture');
    assert.equal(locked.locked, true);
    assert.equal(locked.videoStreamUrl, undefined);
    assert.equal(locked.videoUrl, undefined);
    assert.ok(preview.videoStreamUrl);
  });

  test('uploaded videos are not publicly served from /uploads', async () => {
    const res = await request(app).get('/uploads/videos/anything.mp4');
    assert.equal(res.status, 404);
  });

  test('non-enrolled student cannot open a locked lecture', async () => {
    const res = await request(app).get(`/api/lectures/${ids.lockedLecture}`).set(auth('student'));
    assert.equal(res.status, 403);
  });

  test('media links require a valid token for that lecture', async () => {
    const preview = await request(app).get(`/api/lectures/${ids.previewLecture}`);
    const url = preview.body.videoStreamUrl;
    const stream = await request(app).get(url);
    assert.equal(stream.status, 200);

    const noToken = await request(app).get(`/api/lectures/${ids.previewLecture}/video`);
    assert.equal(noToken.status, 401);

    // A token issued for the preview must not unlock a different lecture
    const token = new URL(url, 'http://x').searchParams.get('token');
    const reuse = await request(app).get(`/api/lectures/${ids.lockedLecture}/video?token=${token}`);
    assert.equal(reuse.status, 401);

    // ...and must not work as a login token
    const asLogin = await request(app).get('/api/users/profile').set('Authorization', `Bearer ${token}`);
    assert.equal(asLogin.status, 401);
  });

  test('free course enrollment unlocks content; paid course requires payment', async () => {
    const paid = await request(app).post(`/api/courses/${ids.paidCourse}/enroll`).set(auth('student'));
    assert.equal(paid.status, 402);

    const free = await request(app).post(`/api/courses/${ids.freeCourse}/enroll`).set(auth('student'));
    assert.equal(free.status, 200);

    const details = await request(app).get(`/api/courses/${ids.freeCourse}`).set(auth('student'));
    assert.equal(details.body.isEnrolled, true);
    assert.ok(details.body.lectures.every((l) => !l.locked));

    const login = await request(app)
      .post('/api/users/login')
      .send({ email: 'student@test.dev', password: 'secret123' });
    assert.equal(login.status, 200, 'enrollment must not break the password');
  });

  test('rating requires enrollment and a valid score', async () => {
    const notEnrolled = await request(app)
      .post(`/api/courses/${ids.paidCourse}/ratings`)
      .set(auth('student'))
      .send({ rating: 5 });
    assert.equal(notEnrolled.status, 403);

    const invalid = await request(app)
      .post(`/api/courses/${ids.freeCourse}/ratings`)
      .set(auth('student'))
      .send({ rating: 9 });
    assert.equal(invalid.status, 400);

    const ok = await request(app)
      .post(`/api/courses/${ids.freeCourse}/ratings`)
      .set(auth('student'))
      .send({ rating: 4, review: 'Good' });
    assert.equal(ok.status, 201);
    assert.equal(ok.body.course.avgRating, 4);
  });

  test('invalid ids return 400 and unknown ids 404', async () => {
    const bad = await request(app).get('/api/courses/not-an-id');
    assert.equal(bad.status, 400);
    const missing = await request(app).get(`/api/courses/${new mongoose.Types.ObjectId()}`);
    assert.equal(missing.status, 404);
  });
});

describe('payments', () => {
  const sign = (orderId, paymentId) =>
    crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

  test('paid enrollment: order -> verify -> enrolled', async () => {
    const order = await request(app)
      .post('/api/payments/create-order')
      .set(auth('student'))
      .send({ courseId: ids.paidCourse });
    assert.equal(order.status, 200, JSON.stringify(order.body));
    assert.equal(order.body.amount, 49900);
    assert.equal(order.body.keyId, 'rzp_test_dummy');
    ids.order = order.body.id;

    const verify = await request(app)
      .post('/api/payments/verify')
      .set(auth('student'))
      .send({
        razorpayOrderId: ids.order,
        razorpayPaymentId: 'pay_1',
        razorpaySignature: sign(ids.order, 'pay_1'),
        courseId: ids.paidCourse,
      });
    assert.equal(verify.status, 200, JSON.stringify(verify.body));

    const lecture = await request(app).get(`/api/lectures/${ids.lockedLecture}`).set(auth('student'));
    assert.equal(lecture.status, 200);
  });

  test('payment provider failures return 502, never 401', async () => {
    setRazorpayClient({
      orders: { create: async () => Promise.reject({ statusCode: 401, error: { description: 'bad key' } }) },
    });
    try {
      const res = await request(app)
        .post('/api/payments/create-order')
        .set(auth('student2'))
        .send({ courseId: ids.paidCourse });
      assert.equal(res.status, 502);
    } finally {
      let n = 100;
      setRazorpayClient({
        orders: { create: async ({ amount, currency }) => ({ id: `order_${++n}`, amount, currency }) },
      });
    }
  });

  test('a verified order cannot be replayed', async () => {
    const res = await request(app)
      .post('/api/payments/verify')
      .set(auth('student'))
      .send({
        razorpayOrderId: ids.order,
        razorpayPaymentId: 'pay_1',
        razorpaySignature: sign(ids.order, 'pay_1'),
      });
    assert.equal(res.status, 400);
  });

  test("another user's order cannot be redeemed", async () => {
    const order = await request(app)
      .post('/api/payments/create-order')
      .set(auth('student2'))
      .send({ courseId: ids.paidCourse });
    assert.equal(order.status, 200);

    const res = await request(app)
      .post('/api/payments/verify')
      .set(auth('sneaky'))
      .send({
        razorpayOrderId: order.body.id,
        razorpayPaymentId: 'pay_2',
        razorpaySignature: sign(order.body.id, 'pay_2'),
      });
    assert.equal(res.status, 400);
  });

  test('a forged signature is rejected', async () => {
    const res = await request(app)
      .post('/api/payments/verify')
      .set(auth('student2'))
      .send({ razorpayOrderId: 'order_2', razorpayPaymentId: 'pay_x', razorpaySignature: 'f'.repeat(64) });
    assert.equal(res.status, 400);
  });

  test('payment history shows only the user\'s own successful payments', async () => {
    const mine = await request(app).get('/api/payments/history').set(auth('student'));
    assert.equal(mine.body.length, 1);
    const theirs = await request(app).get(`/api/payments/${mine.body[0]._id}`).set(auth('student2'));
    assert.equal(theirs.status, 403);
  });
});

describe('course deletion', () => {
  test('deleting a course removes its lectures and enrollments', async () => {
    const res = await request(app).delete(`/api/courses/${ids.freeCourse}`).set(auth('teacher'));
    assert.equal(res.status, 200);

    const lectures = await request(app).get(`/api/lectures/course/${ids.freeCourse}`);
    assert.equal(lectures.status, 404);

    const profile = await request(app).get('/api/users/profile').set(auth('student'));
    assert.ok(profile.body.enrolledCourses.every((c) => c._id !== ids.freeCourse));
  });
});

describe('contact messages', () => {
  const valid = { name: 'Asha', email: 'Asha@Example.com', message: 'I have a question about a course.' };

  test('saves a valid message, and only admins can read messages', async () => {
    const sent = await request(app).post('/api/contact').send(valid);
    assert.equal(sent.status, 201);

    const denied = await request(app).get('/api/contact').set(auth('student'));
    assert.equal(denied.status, 403);
    const anonymous = await request(app).get('/api/contact');
    assert.equal(anonymous.status, 401);

    const list = await request(app).get('/api/contact').set(auth('admin'));
    assert.equal(list.status, 200);
    assert.equal(list.body.count, 1);
    assert.equal(list.body.messages[0].email, 'asha@example.com');
  });

  test('rejects missing, invalid and non-text fields', async () => {
    for (const body of [
      {},
      { ...valid, email: 'not-an-email' },
      { ...valid, message: 'short' },
      { ...valid, message: 'x'.repeat(2001) },
      { ...valid, name: { $ne: null } },
    ]) {
      const res = await request(app).post('/api/contact').send(body);
      assert.equal(res.status, 400, JSON.stringify(body).slice(0, 80));
    }
  });

  test('silently drops messages that fill in the hidden bot trap', async () => {
    const res = await request(app).post('/api/contact').send({ ...valid, website: 'spam.example' });
    assert.equal(res.status, 201);

    const list = await request(app).get('/api/contact').set(auth('admin'));
    assert.equal(list.body.count, 1, 'the bot message must not be stored');
  });

  test('the public form is rate limited', async () => {
    const res = await request(app).post('/api/contact').send(valid);
    assert.match(res.headers.ratelimit, /limit=50/);
  });
});

test('hosted video links are played directly, but stay hidden on locked lectures', async () => {
  const { toLectureResponse } = await import('../utils/courseAccess.js');
  const lecture = {
    _id: new mongoose.Types.ObjectId(),
    title: 'Hosted',
    videoUrl: 'https://videos.example/clip.mp4',
    resources: [],
  };

  const open = toLectureResponse(lecture, { unlocked: true });
  assert.equal(open.videoStreamUrl, 'https://videos.example/clip.mp4');
  assert.equal(open.videoUrl, undefined);

  const locked = toLectureResponse(lecture, { unlocked: false });
  assert.equal(locked.videoStreamUrl, undefined);
  assert.equal(locked.videoUrl, undefined);
});

test('unknown API routes return JSON 404', async () => {
  const res = await request(app).get('/api/does-not-exist');
  assert.equal(res.status, 404);
  assert.ok(res.body.message);
});
