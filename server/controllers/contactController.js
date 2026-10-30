import ContactMessage from '../models/contactMessageModel.js';

// Only accept plain strings from the request body
const str = (value) => (typeof value === 'string' ? value : undefined);

// @desc    Send a contact message
// @route   POST /api/contact
// @access  Public
export const createContactMessage = async (req, res, next) => {
  try {
    // `website` is a hidden field real visitors never fill in, so anything in it
    // is a bot. Report success so the bot has no reason to try again.
    if (req.body.website) {
      return res.status(201).json({ message: 'Message sent' });
    }

    await ContactMessage.create({
      name: str(req.body.name),
      email: str(req.body.email),
      message: str(req.body.message),
    });

    res.status(201).json({ message: 'Message sent' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get contact messages (admin only)
// @route   GET /api/contact
// @access  Private/Admin
export const getContactMessages = async (req, res, next) => {
  try {
    const pageSize = Math.min(Number(req.query.limit) || 50, 100);
    const page = Math.max(Number(req.query.pageNumber) || 1, 1);

    const [count, messages] = await Promise.all([
      ContactMessage.countDocuments({}),
      ContactMessage.find({})
        .sort({ createdAt: -1 })
        .limit(pageSize)
        .skip(pageSize * (page - 1)),
    ]);

    res.json({ messages, page, pages: Math.ceil(count / pageSize), count });
  } catch (error) {
    next(error);
  }
};
