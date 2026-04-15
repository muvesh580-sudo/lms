import mongoose from 'mongoose';

const lectureSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a lecture title'],
      trim: true,
      maxlength: [100, 'Lecture title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please add a lecture description'],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    videoUrl: {
      type: String,
      required: [true, 'Please add a video URL'],
    },
    duration: {
      type: Number,
      required: [true, 'Please add the video duration in minutes'],
    },
    order: {
      type: Number,
      required: [true, 'Please specify the order in the course'],
    },
    resources: [
      {
        title: {
          type: String,
          required: true,
        },
        fileUrl: {
          type: String,
          required: true,
        },
        fileType: {
          type: String,
          enum: ['pdf', 'doc', 'ppt', 'zip', 'other'],
          required: true,
        },
      },
    ],
    isPreview: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Lecture = mongoose.model('Lecture', lectureSchema);

export default Lecture;