import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a course title'],
      trim: true,
      maxlength: [100, 'Course title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please add a course description'],
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    price: {
      type: Number,
      required: [true, 'Please add a course price'],
      min: [0, 'Price cannot be negative'],
    },
    thumbnail: {
      type: String,
      default: 'default-course.jpg',
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: [
        'Web Development',
        'Mobile Development',
        'Data Science',
        'Machine Learning',
        'DevOps',
        'Business',
        'Design',
        'Other',
      ],
    },
    level: {
      type: String,
      required: [true, 'Please select a level'],
      enum: ['Beginner', 'Intermediate', 'Advanced'],
    },
    duration: {
      type: String,
      required: [true, 'Please add a course duration'],
    },
    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    ratings: [
      {
        rating: {
          type: Number,
          min: 1,
          max: 5,
          required: true,
        },
        review: {
          type: String,
        },
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    avgRating: {
      type: Number,
      default: 0,
    },
    published: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field for lectures
courseSchema.virtual('lectures', {
  ref: 'Lecture',
  localField: '_id',
  foreignField: 'course',
  justOne: false,
});

courseSchema.index({ published: 1, createdAt: -1 });
courseSchema.index({ instructor: 1 });

// Calculate average rating when saving
courseSchema.pre('save', function (next) {
  if (this.ratings.length > 0) {
    this.avgRating =
      this.ratings.reduce((sum, item) => sum + item.rating, 0) /
      this.ratings.length;
  }
  next();
});

const Course = mongoose.model('Course', courseSchema);

export default Course;