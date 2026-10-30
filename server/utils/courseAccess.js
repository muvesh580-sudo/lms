import jwt from 'jsonwebtoken';

const idOf = (value) => (value?._id ?? value)?.toString();

// Work out what the current user (possibly anonymous) may do with a course
export const getCourseAccess = (course, user) => {
  const isAdmin = user?.role === 'admin';
  const isInstructor = !!user && idOf(course.instructor) === user._id.toString();
  const isEnrolled =
    !!user && (user.enrolledCourses || []).some((c) => idOf(c) === course._id.toString());

  return {
    isAdmin,
    isInstructor,
    isEnrolled,
    canManage: isAdmin || isInstructor,
    canViewContent: isAdmin || isInstructor || isEnrolled,
  };
};

// Short-lived token that lets a <video>/<a> tag fetch one lecture's files
// without putting the login token in a URL
export const signMediaToken = (lectureId, userId) =>
  jwt.sign({ purpose: 'media', lecture: lectureId.toString(), user: userId?.toString() }, process.env.JWT_SECRET, {
    expiresIn: '2h',
  });

export const verifyMediaToken = (token, lectureId) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    return decoded.purpose === 'media' && decoded.lecture === lectureId.toString();
  } catch {
    return false;
  }
};

// Shape a lecture for the client: private file names are swapped for
// tokenised API URLs, and locked lectures expose no file locations at all
export const toLectureResponse = (lecture, { unlocked, userId }) => {
  const data = lecture.toObject ? lecture.toObject() : { ...lecture };
  const { videoUrl } = data;
  delete data.videoUrl;

  if (!unlocked) {
    return { ...data, resources: [], locked: true };
  }

  const token = signMediaToken(data._id, userId);
  const base = `/api/lectures/${data._id}`;
  // Hosted videos (e.g. the demo seed's) are played directly from their URL
  const isExternalVideo = /^https?:\/\//.test(videoUrl || '');
  return {
    ...data,
    locked: false,
    videoStreamUrl: isExternalVideo ? videoUrl : `${base}/video?token=${token}`,
    resources: (data.resources || []).map((r) => ({
      _id: r._id,
      title: r.title,
      fileType: r.fileType,
      downloadUrl: `${base}/resources/${r._id}/download?token=${token}`,
    })),
  };
};
