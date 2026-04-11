const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true
    },

    description: {
      type: String,
      required: [true, "Description is required"]
    },

    status: {
      type: String,
      enum: ["pending", "in_progress", "resolved"],
      default: "pending"
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },

    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    
    validationStatus: {
      type: String,
      enum: ["pending", "published", "rejected"],
      default: "pending"
    },

    incidentType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "IncidentType"
    },

    provinceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Province"
    },

    municipalityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Municipality"
    },

    neighborhoodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Neighborhood"
    },

    location: {
      lat: { type: Number },
      lng: { type: Number }
    },

    occurrenceDate: {
      type: Date
    },

    deaths: {
      type: Number,
      default: 0
    },

    injured: {
      type: Number,
      default: 0
    },

    socialLink: {
      type: String
    },

    imageBase64: {
      type: String
    },

    comments: [
      {
        userEmail: { type: String, required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Incident", incidentSchema);
