const Province = require('../models/Province');
const Municipality = require('../models/Municipality');
const Neighborhood = require('../models/Neighborhood');
const IncidentType = require('../models/IncidentType');
const Incident = require('../models/incident');
const User = require('../models/user');

exports.getProvinces = async (req, res) => {
    try { res.json(await Province.find()); } catch(e) { res.status(500).json({error: e.message}); }
};
exports.createProvince = async (req, res) => {
    try { res.json(await Province.create({ name: req.body.name })); } catch(e) { res.status(500).json({error: e.message}); }
};
exports.updateProvince = async (req, res) => {
    try { res.json(await Province.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true })); } catch(e) { res.status(500).json({error: e.message}); }
};
exports.deleteProvince = async (req, res) => {
    try { res.json(await Province.findByIdAndDelete(req.params.id)); } catch(e) { res.status(500).json({error: e.message}); }
};

exports.getMunicipalities = async (req, res) => {
    try { 
        const filter = req.query.provinceId ? { provinceId: req.query.provinceId } : {};
        res.json(await Municipality.find(filter).populate('provinceId')); 
    } catch(e) { res.status(500).json({error: e.message}); }
};
exports.createMunicipality = async (req, res) => {
    try { res.json(await Municipality.create({ name: req.body.name, provinceId: req.body.provinceId })); } catch(e) { res.status(500).json({error: e.message}); }
};
exports.updateMunicipality = async (req, res) => {
    try { res.json(await Municipality.findByIdAndUpdate(req.params.id, { name: req.body.name, provinceId: req.body.provinceId }, { new: true })); } catch(e) { res.status(500).json({error: e.message}); }
};
exports.deleteMunicipality = async (req, res) => {
    try { res.json(await Municipality.findByIdAndDelete(req.params.id)); } catch(e) { res.status(500).json({error: e.message}); }
};

exports.getNeighborhoods = async (req, res) => {
    try { 
        const filter = req.query.municipalityId ? { municipalityId: req.query.municipalityId } : {};
        res.json(await Neighborhood.find(filter).populate('municipalityId')); 
    } catch(e) { res.status(500).json({error: e.message}); }
};
exports.createNeighborhood = async (req, res) => {
    try { res.json(await Neighborhood.create({ name: req.body.name, municipalityId: req.body.municipalityId })); } catch(e) { res.status(500).json({error: e.message}); }
};
exports.updateNeighborhood = async (req, res) => {
    try { res.json(await Neighborhood.findByIdAndUpdate(req.params.id, { name: req.body.name, municipalityId: req.body.municipalityId }, { new: true })); } catch(e) { res.status(500).json({error: e.message}); }
};
exports.deleteNeighborhood = async (req, res) => {
    try { res.json(await Neighborhood.findByIdAndDelete(req.params.id)); } catch(e) { res.status(500).json({error: e.message}); }
};

exports.getIncidentTypes = async (req, res) => {
    try { res.json(await IncidentType.find()); } catch(e) { res.status(500).json({error: e.message}); }
};
exports.createIncidentType = async (req, res) => {
    try { res.json(await IncidentType.create({ name: req.body.name, description: req.body.description })); } catch(e) { res.status(500).json({error: e.message}); }
};
exports.updateIncidentType = async (req, res) => {
    try { res.json(await IncidentType.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true })); } catch(e) { res.status(500).json({error: e.message}); }
};
exports.deleteIncidentType = async (req, res) => {
    try { res.json(await IncidentType.findByIdAndDelete(req.params.id)); } catch(e) { res.status(500).json({error: e.message}); }
};

exports.getPendingIncidents = async (req, res) => {
    try {
        const incidents = await Incident.find({ validationStatus: 'pending' })
            .populate('reportedBy', 'name email')
            .populate('incidentType', 'name')
            .populate('provinceId', 'name')
            .populate('municipalityId', 'name')
            .populate('neighborhoodId', 'name');
        res.json(incidents);
    } catch(e) { res.status(500).json({error: e.message}); }
};
exports.publishIncident = async (req, res) => {
    try {
        const incident = await Incident.findByIdAndUpdate(req.params.id, { validationStatus: 'published' }, { new: true });
        res.json(incident);
    } catch(e) { res.status(500).json({error: e.message}); }
};
exports.rejectIncident = async (req, res) => {
    try {
        const incident = await Incident.findByIdAndUpdate(req.params.id, { validationStatus: 'rejected' }, { new: true });
        res.json(incident);
    } catch(e) { res.status(500).json({error: e.message}); }
};

exports.mergeIncidents = async (req, res) => {
    try {
        const { primaryId, secondaryIds } = req.body;
        if (!primaryId || !secondaryIds || !secondaryIds.length) {
            return res.status(400).json({ message: "Se requiere un primaryId y secondaryIds" });
        }
        await Incident.deleteMany({ _id: { $in: secondaryIds } });
        res.json({ message: "Incidentes fusionados exitosamente" });
    } catch(e) { res.status(500).json({error: e.message}); }
};

exports.getStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalIncidents = await Incident.countDocuments();
        const pendingValidations = await Incident.countDocuments({ validationStatus: 'pending' });
        const published = await Incident.countDocuments({ validationStatus: 'published' });
        res.json({ totalUsers, totalIncidents, pendingValidations, published });
    } catch(e) { res.status(500).json({error: e.message}); }
};
