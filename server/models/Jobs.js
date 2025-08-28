const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    jobName: {
        type: String,
        required: true,
        trim: true
    },
    jobType: {
        type: String,
        required: true,
        trim: true
    },
    salaryRange: {
        minSalary: {
            type: Number,
            required: true
        },
        maxSalary: {
            type: Number,
            required: true
        }
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    experienceLevel: {
        type: String,
        required: true,
        trim: true
    },
    qualifications: {
        type: [String],
        required: true
    },
    skills: {
        type: [String],
        required: true
    },
    responsibilities: {
        type: [String],
        required: true
    },
    companyName: {
        type: String,
        required: true,
        trim: true
    },
    companyDescription: {
        type: String,
        required: true,
        trim: true
    },
    website: {
        type: String,
        required: true,
        trim: true
    },
    companyEmail: {
        type: String,
        required: true,
        trim: true
    },
    companyPhoneNumber: {
        type: String,
        required: true,
        trim: true
    },
    postedDate: {
        // type: Date,
        type: String,
        required: true
    },
    applicationDeadline: {
        // type: Date,
        type: String,
        required: true
    },
    employmentBenefits: {
        type: [String],
        required: true
    },
    workSchedule: {
        type: String,
        required: true,
        trim: true
    },
    tags: {
        type: [String],
        required: true
    },
    employerId: {
        type: String,
        required: true
    },
    applicants: {
        type: Array,
        required: true,
    }
});

module.exports = jobSchema;