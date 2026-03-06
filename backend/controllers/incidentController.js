const Incident = require('../models/incident');

exports.createIncident = async (req, res) => {
    try {
        const { title, description, status, priority, reportedBy } = req.body;

        if (!title || !description || !reportedBy) {
            return res.status(400).json({ message: "Title, description, and reportedBy are required" });
        }

        const newIncident = new Incident({ title, description, status, priority, reportedBy });
        await newIncident.save();

        res.status(201).json({ message: "Incident created successfully", incident: newIncident });
    } catch (error) {
        res.status(500).json({ message: "Error creating incident", error: error.message });
    }
};

exports.getIncidents = async (req, res) => {
    try {
        const incidents = await Incident.find().populate('reportedBy', 'name email');
        res.status(200).json(incidents);
    } catch (error) {
        res.status(500).json({ message: "Error fetching incidents", error: error.message });
    }
};

exports.getIncidentById = async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id).populate('reportedBy', 'name email');
        if (!incident) {
            return res.status(404).json({ message: "Incident not found" });
        }
        res.status(200).json(incident);
    } catch (error) {
        res.status(500).json({ message: "Error fetching incident", error: error.message });
    }
};

exports.updateIncident = async (req, res) => {
    try {
        const { title, description, status, priority } = req.body;

        const updatedIncident = await Incident.findByIdAndUpdate(
            req.params.id,
            { title, description, status, priority },
            { new: true, runValidators: true }
        ).populate('reportedBy', 'name email');

        if (!updatedIncident) {
            return res.status(404).json({ message: "Incident not found" });
        }

        res.status(200).json({ message: "Incident updated successfully", incident: updatedIncident });
    } catch (error) {
        res.status(500).json({ message: "Error updating incident", error: error.message });
    }
};

exports.deleteIncident = async (req, res) => {
    try {
        const deletedIncident = await Incident.findByIdAndDelete(req.params.id);

        if (!deletedIncident) {
            return res.status(404).json({ message: "Incident not found" });
        }

        res.status(200).json({ message: "Incident deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting incident", error: error.message });
    }
};
