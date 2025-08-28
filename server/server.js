const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({
  path: path.join(__dirname, ".devcontainer", "devcontainer.env"),
});
console.log("Current working directory:", process.cwd());
console.log(
  "Attempting to load env from:",
  `${process.cwd()}/.devcontainer/devcontainer.env`
);
console.log(
  "Env loading result:",
  dotenv.config({
    path: "./.devcontainer/devcontainer.env",
  })
);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // To parse JSON bodies

// Import Schemas
const userSchema = require("./models/Users");
const jobSchema = require("./models/Jobs");

// Mapping of database names to their respective URIs
const uriMap = {
  TalentLinkDB: process.env.MONGO_URI, // For Users and Employees collections
};

// Store connections and models
const connections = {};
const models = {};

// Function to get or create a connection based on the database name
const getConnection = async (dbName) => {
  console.log("getConnection called with dbName:", dbName);

  if (!uriMap[dbName]) {
    throw new Error(`No URI mapped for database: ${dbName}`);
  }

  if (!connections[dbName]) {
    const DB_URI = uriMap[dbName];
    console.log(`Creating new connection for ${dbName}.`);

    connections[dbName] = await mongoose.createConnection(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`New connection established for database: ${dbName}`);
  } else {
    console.log(`Reusing existing connection for database: ${dbName}`);
  }

  return connections[dbName];
};

// Function to get or create a model based on the database and collection name
const getModel = async (dbName, collectionName) => {
  console.log("getModel called with:", { dbName, collectionName });

  const modelKey = `${dbName}-${collectionName}`;
  console.log("Generated modelKey:", modelKey);

  if (!models[modelKey]) {
    console.log("Model not found in cache, creating new model");
    const connection = await getConnection(dbName);

    // Assign the appropriate schema based on the collection name
    let schema;
    switch (collectionName) {
      case "users":
        schema = userSchema;
        break;
      case "published_jobs":
        schema = jobSchema;
        break;
      case "pending_jobs":
        schema = jobSchema;
        break;
      default:
        throw new Error(`No schema defined for collection: ${collectionName}`);
    }

    models[modelKey] = connection.model(collectionName, schema, collectionName);
    console.log(`Created new model for collection: ${collectionName}`);
  } else {
    console.log(`Reusing cached model for: ${modelKey}`);
  }

  return models[modelKey];
};

// GET route to find a specific user using id
app.get("/retrieve-user/:database/:collection/:userId", async (req, res) => {
  try {
    const { database, collection, userId } = req.params;
    console.log("GET request received for:", { database, collection, userId });

    const Model = await getModel(database, collection);
    console.log("Model retrieved, executing find query");

    let user = await Model.findOne({ _id: userId }).lean();

    if (user) {
      console.log(`Successfully retrieved user: ${user} with ID: ${userId}`);
      res.status(200).json(user);
    } else {
      throw new Error(`User with ID ${userId} not found in both collections`);
    }
  } catch (err) {
    console.error("Error in GET route:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET route to find a user using email and password
app.get("/log-in/:database/:collection/:email/:password", async (req, res) => {
  try {
    const { database, collection, email, password } = req.params;
    console.log("GET request received for:", {
      database,
      collection,
      email,
      password,
    });

    const Model = await getModel(database, collection);
    console.log("Model retrieved, executing find query");

    const user = await Model.findOne({
      email: email,
      password: password,
    }).lean();
    console.log(user);
    if (user) {
      console.log(`Successfully retrieved user: ${user} with email: ${email}`);
      res.status(200).json(user._id);
    } else {
      throw new Error(
        `User with email ${email} not found or password is incorrect`
      );
    }
  } catch (err) {
    console.error("Error in GET route:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST route to sign up a new user
app.post("/sign-up/:database/:collection", async (req, res) => {
  try {
    const { database, collection } = req.params;
    // const { username, email, password } = req.body;
    const {
      firstName,
      lastName,
      school,
      graduationYear,
      major,
      company,
      position,
      companySize,
      email,
      password,
      isEmployer,
      isAdmin,
    } = req.body;

    const Model = await getModel(database, collection);
    console.log("Model retrieved, executing save query");

    // Check if a user with the same email already exists
    const existingUser = await Model.findOne({
      email: email,
    }).lean();
    if (existingUser) {
      throw new Error(`User with email ${email} already exists`);
    }

    const newUser = new Model({
      firstName: firstName,
      lastName: lastName,
      // location: {
      //   country: null,
      //   city: null,
      //   address: null,
      //   zip_code: null,
      // },
      school: school,
      graduationYear: graduationYear,
      major: major,
      notifications: [],
      appliedJobs: [],
      company: company,
      position: position,
      companySize: companySize,
      publishedJobs: [],
      pendingJobs: [],
      email: email,
      // phone_number: null,
      password: password,
      isEmployer: isEmployer,
      isAdmin: isAdmin,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await newUser.save();

    console.log(`Successfully created user: ${newUser} with email: ${email}`);
    res.status(201).json(newUser);
  } catch (err) {
    if (err.message.includes("User with email")) {
      console.error(
        "User with email already exists, returning 409 status code"
      );
      res
        .status(409)
        .json({ error: "User with the same email already exists" });
    } else {
      console.error("Error in POST route:", err);
      res.status(500).json({ error: err.message });
    }
  }
});

// POST route to sign up a new user
app.post("/user-apply/:database/:collection", async (req, res) => {
  try {
    const { database, collection } = req.params;
    // const { username, email, password } = req.body;
    const {
      firstName,
      lastName,
      email,
      phone,
      school,
      graduationDate,
      languageList,
      jobRole,
      workAuthorization,
      experienceLevel,
      aboutMe,
      comments,
      jobId,
      userId,
    } = req.body;

    const UserModel = await getModel(database, collection); // Assuming 'users' is the collection name for users
    const JobModel = await getModel(database, "published_jobs"); // Assuming 'published_jobs' is the collection name for jobs

    console.log("Models retrieved, executing save query");

    // Find the user by userId
    const user = await UserModel.findById(userId).lean();
    if (!user) {
      return res.status(404).send("User not found");
    }

    // Check if the user has already applied to the job
    const alreadyApplied = user.appliedJobs.some((job) => job.jobId === jobId);
    if (alreadyApplied) {
      return res.status(409).send("Already applied to job");
    }

    // Find the job by jobId
    const job = await JobModel.findById(jobId).lean();
    if (!job) {
      return res.status(404).send("Job not found");
    }

    const employerId = job.employerId;
    const employer = await UserModel.findById(employerId).lean();
    if (!employer) {
      return res.status(404).send("Employer not found");
    }

    // Create the new applied job object
    const appliedJob = {
      jobId: jobId,
      jobName: job.jobName,
      location: job.location,
      companyName: job.companyName,
      companyDescription: job.companyDescription,
      website: job.website,
      companyEmail: job.companyEmail,
      companyPhoneNumber: job.companyPhoneNumber,
      jobType: job.jobType,
      salaryRange: job.salaryRange,
      experienceLevel: job.experienceLevel,
      qualifications: job.qualifications,
      skills: job.skills,
      responsibilities: job.responsibilities,
      postedDate: job.postedDate,
      applicationDeadline: job.applicationDeadline,
      employmentBenefits: job.employmentBenefits,
      workSchedule: job.workSchedule,
      dateApplied: new Date(),
      userId: userId,
      firstName: firstName,
      lastName: lastName,
      email: email,
      phone: phone,
      school: school,
      graduationDate: graduationDate,
      languageList: languageList,
      jobRole: jobRole,
      major: user.major,
      workAuthorization: workAuthorization,
      experienceLevel: experienceLevel,
      aboutMe: aboutMe,
      comments: comments,
      applicationStatus: "Under Review",
    };

    // Add the new applied job to the user's appliedJobs array
    user.appliedJobs.push(appliedJob);

    // Find and update the specific job in the employer's publishedJobs array
    const employerJobIndex = employer.publishedJobs.findIndex(
      (job) => job._id.toString() === jobId
    );

    if (employerJobIndex === -1) {
      return res.status(404).send("Employer's job not found");
    }

    employer.publishedJobs[employerJobIndex].applicants.push(appliedJob);

    // Save the updated user
    // await UserModel.findByIdAndUpdate(userId, {
    //   appliedJobs: user.appliedJobs,
    // });

    // Save the updates to the user and employer
    await Promise.all([
      UserModel.findByIdAndUpdate(userId, { appliedJobs: user.appliedJobs }),
      UserModel.findByIdAndUpdate(employerId, {
        publishedJobs: employer.publishedJobs,
      }),
    ]);

    res.status(201).send("Job application submitted successfully");
  } catch (error) {
    console.error("Error applying to job:", error);
    res.status(500).send("Internal server error");
  }
});

// DELETE route to remove a document by ID
app.delete("/delete/:database/:collection/:id", async (req, res) => {
  try {
    const { database, collection, id } = req.params;

    const Model = await getModel(database, collection);
    const result = await Model.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).send(`Document with ID ${id} not found.`);
    }
    res.status(200).send(`Document with ID ${id} deleted successfully.`);
  } catch (err) {
    console.error("Error in DELETE route:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST route to push a job to pending jobs DB as an employer
app.post("/post-job/:database/:collection", async (req, res) => {
  try {
    const { database, collection } = req.params;
    const {
      applicationDeadline,
      companyDescription,
      companyEmail,
      companyName,
      companyPhoneNumber,
      employerId,
      employmentBenefits,
      experienceLevel,
      jobName,
      jobType,
      location,
      maxSalary,
      minSalary,
      qualifications,
      responsibilities,
      skills,
      tags,
      website,
      workSchedule,
    } = req.body;
    console.log("Req.body,", req.body);

    // const Model = await getModel(database, collection);
    const JobModel = await getModel(database, collection); // Assuming 'published_jobs' is the collection name for jobs
    const UserModel = await getModel(database, "users"); // Assuming 'users' is the collection name for users

    if (req.body) {
      // Insert the document into the published jobs collection
      const newJob = new JobModel({
        applicationDeadline: applicationDeadline,
        companyDescription: companyDescription,
        companyEmail: companyEmail,
        companyName: companyName,
        companyPhoneNumber: companyPhoneNumber,
        employerId: employerId,
        employmentBenefits: employmentBenefits
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item),
        experienceLevel: experienceLevel,
        jobName: jobName,
        jobType: jobType,
        location: location,
        salaryRange: {
          minSalary: minSalary,
          maxSalary: maxSalary,
        },
        qualifications: qualifications
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item),
        responsibilities: responsibilities
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item),
        skills: skills
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item),
        tags: tags,
        website: website,
        workSchedule: workSchedule,
        applicants: [],
        postedDate: new Date(),
      });
      await newJob.save();

      // Find the employer in the users collection
      const employer = await UserModel.findById(employerId);
      if (!employer) {
        return res.status(404).send("Employer not found");
      }

      // Add the new job to the pendingJobs array of the employer
      employer.pendingJobs.push(newJob);

      // Save the updated employer object
      await employer.save();

      console.log(
        `Successfully created job: ${newJob} and added to employer's pending jobs`
      );

      res.status(201).json({ newJob });
    } else {
      res.status(400).json({
        error: "Request body must contain a document",
      });
    }
  } catch (err) {
    console.error("Error in POST route:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST route to push a pending job to published jobs DB and remove it from pending jobs DB
app.post("/approve-pending-job/:database/:collection", async (req, res) => {
  try {
    const { database, collection } = req.params;

    const Model = await getModel(database, collection);
    const publishedModel = await getModel(database, "published_jobs");
    const UserModel = await getModel(database, "users"); // Assuming 'users' is the collection name for users

    if (req.body) {
      // Insert the document into the published jobs collection
      const newJob = await publishedModel.create(req.body);

      // Remove the document from the pending jobs collection
      await Model.deleteOne({ _id: req.body._id });

      // Find the employer in the users collection
      const employer = await UserModel.findById(req.body.employerId);
      if (!employer) {
        return res.status(404).send("Employer not found");
      }

      // Add the new job to the publishedJobs array of the employer
      employer.publishedJobs.push(newJob);

      // Remove the job from the employer's pendingJobs array
      employer.pendingJobs = employer.pendingJobs.filter(
        (job) => job._id.toString() !== req.body._id
      );

      // Save the updated employer object
      await employer.save();

      res.status(201).json({
        message: "Document inserted and removed from pending jobs successfully",
        insertedId: newJob._id,
      });
    } else {
      res.status(400).json({
        error: "Request body must contain a document",
      });
    }
  } catch (err) {
    console.error("Error in POST route:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete route to remove a job from the pending jobs collection
app.delete(
  "/reject-pending-job/:database/:collection/:id/:employerId",
  async (req, res) => {
    try {
      const { database, collection, id, employerId } = req.params;

      const Model = await getModel(database, collection);
      const UserModel = await getModel(database, "users");

      // Find the employer in the users collection
      const employer = await UserModel.findById(employerId);
      if (!employer) {
        return res.status(404).send("Employer not found");
      }

      // Remove the job from the employer's pendingJobs array
      employer.pendingJobs = employer.pendingJobs.filter(
        (job) => job._id.toString() !== id
      );

      await employer.save();

      const result = await Model.findByIdAndDelete(id);
      if (!result) {
        return res.status(404).send(`Document with ID ${id} not found.`);
      }
      res.status(200).send(`Document with ID ${id} deleted successfully.`);
    } catch (err) {
      console.error("Error in DELETE route:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// POST Endpoint to update the status of an applicant's application
app.post(
  "/update-application-status/:database/:collection",
  async (req, res) => {
    try {
      const { database, collection } = req.params;
      const { userId, jobId, newStatus } = req.body;

      const UserModel = await getModel(database, "users"); // Assuming 'users' is the collection name for users
      const JobModel = await getModel(database, collection);

      // Find the user by userId
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).send("User not found");
      }

      // Find the job by jobId
      const job = await JobModel.findById(jobId);
      if (!job) {
        return res.status(404).send("Job not found");
      }

      // Update the application status in the user's appliedJobs array
      const application = user.appliedJobs.find(
        (app) => app.jobId.toString() === jobId
      );
      if (!application) {
        return res.status(404).send("Application not found");
      }
      application.applicationStatus = newStatus;

      // Create a new notification object
      const newNotification = {
        id: new mongoose.Types.ObjectId(),
        type: newStatus,
        jobTitle: job.jobName,
        company: job.companyName,
        date: new Date(),
      };

      // Push the new notification object into the user's notifications array
      user.notifications.unshift(newNotification);

      user.markModified(
        `appliedJobs.${user.appliedJobs.findIndex(
          (app) => app.jobId.toString() === jobId
        )}`
      );

      // Save the updated user object
      await user.save();

      // Find the employer by employerId
      const employer = await UserModel.findById(job.employerId);
      if (!employer) {
        return res.status(404).send("Employer not found");
      }

      // Update the application status in the employer's publishedJobs array
      const employerJobIndex = employer.publishedJobs.findIndex(
        (job) => job._id.toString() === jobId
      );
      if (employerJobIndex === -1) {
        return res.status(404).send("Employer's job not found");
      }

      // Update the application status in the applicants array of the specific job
      const applicantIndex = employer.publishedJobs[
        employerJobIndex
      ].applicants.findIndex(
        (applicant) => applicant.userId.toString() === userId
      );
      if (applicantIndex === -1) {
        return res.status(404).send("Applicant not found");
      }
      employer.publishedJobs[employerJobIndex].applicants[
        applicantIndex
      ].applicationStatus = newStatus;

      // Mark the nested array as modified
      employer.markModified(
        `publishedJobs.${employerJobIndex}.applicants.${applicantIndex}`
      );

      // Save the updated employer object
      await employer.save();

      console.log(
        `Updated application status for user ${userId} in job ${jobId} to ${newStatus}`
      );
      res.status(201).json(employer);
    } catch (err) {
      console.error("Error in POST route:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ******************** FOR TESTING PURPOSES ************************

app.get("/find/:database/:collection", async (req, res) => {
  try {
    const { database, collection } = req.params;
    console.log("GET request received for:", { database, collection });

    const Model = await getModel(database, collection);
    console.log("Model retrieved, executing find query");

    const documents = await Model.find({}).lean();
    console.log("Query executed, document count:", documents.length);

    res.status(200).json(documents);
  } catch (err) {
    console.error("Error in GET route:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST route to insert documents
app.post("/insert/:database/:collection", async (req, res) => {
  try {
    const { database, collection } = req.params;
    const Model = await getModel(database, collection);

    // Check if single or multiple documents
    if (req.body.document) {
      // Single document insert
      const newDocument = await Model.create(req.body.document);
      res.status(201).json({
        message: "Document inserted successfully",
        insertedId: newDocument._id,
      });
    } else if (req.body.documents && Array.isArray(req.body.documents)) {
      // Multiple documents insert
      const newDocuments = await Model.insertMany(req.body.documents);
      res.status(201).json({
        message: `${newDocuments.length} documents inserted`,
        insertedIds: newDocuments.map((doc) => doc._id),
      });
    } else {
      res.status(400).json({
        error:
          "Request body must contain either 'document' or 'documents' as array",
      });
    }
  } catch (err) {
    console.error("Error in POST route:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE route to remove a document by ID
app.delete("/delete/:database/:collection/:id", async (req, res) => {
  try {
    const { database, collection, id } = req.params;

    const Model = await getModel(database, collection);
    const result = await Model.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).send(`Document with ID ${id} not found.`);
    }
    res.status(200).send(`Document with ID ${id} deleted successfully.`);
  } catch (err) {
    console.error("Error in DELETE route:", err);
    res.status(500).json({ error: err.message });
  }
});

// PUT route to update a document by ID
app.put("/update/:database/:collection/:id", async (req, res) => {
  try {
    const { database, collection, id } = req.params;
    const updateData = req.body.update;

    if (!updateData) {
      return res.status(400).json({ error: "Update data not provided" });
    }

    const Model = await getModel(database, collection);
    const result = await Model.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!result) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.status(200).json({
      message: "Document updated successfully",
      modifiedDocument: result,
    });
  } catch (err) {
    console.error("Error in PUT route:", err);
    res.status(500).json({ error: err.message });
  }
});

// ******************** FOR TESTING PURPOSES **********************

// Test connections before starting server
async function startServer() {
  try {
    console.log("Starting server with environment variables:", {
      MONGO_URI: process.env.MONGO_URI ? "Present" : "Missing",
      PORT: process.env.PORT || 3000,
    });
    console.log("Raw URIs:", {
      server: process.env.MONGO_URI,
    });

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Error starting server:", err);
    process.exit(1);
  }
}
startServer();
