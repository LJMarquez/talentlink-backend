// ./models/Products.js

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // username: {
    //     type: String,
    //     required: [true, 'Username is required'],
    //     trim: true
    // },
    firstName: {
      type: String,
      // required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      // required: [true, 'Last name is required'],
      trim: true,
    },
    // location: {
    //     country: {
    //         type: String,
    //         trim: true
    //     },
    //     city: {
    //         type: String,
    //         trim: true
    //     },
    //     address: {
    //         type: String,
    //         trim: true
    //     },
    //     zip_code: {
    //         type: Number,
    //         trim: true
    //     },
    // },
    school: {
        type: String,
        trim: true,
    },
    graduationYear: {
        type: Number,
        trim: true,
    },
    major: {
        type: String,
        trim: true,
    },
    notifications: {
      type: Array,
      trim: true,
    },
    appliedJobs: {
      type: Array,
      trim: true,
    },
    company: {
        type: String,
        trim: true,
    },
    position: {
        type: String,
        trim: true,
    },
    companySize: {
        type: String,
        trim: true,
    },
    publishedJobs: {
        type: Array,
        trim: true,
    },
    pendingJobs: {
        type: Array,
        trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "password is required"],
      trim: true,
    },
    isAdmin: {
      type: Boolean,
    //   Enumerator: ["true", "false"],
    //   default: false,
    },
    isEmployer: {
      type: Boolean,
    //   Enumerator: ["true", "false"],
      default: false,
    },

    // Add other fields as necessary, no clue what to add now. Add Payment (String)(Edit this when we find a better alternative)
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

module.exports = userSchema;
