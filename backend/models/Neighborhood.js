const mongoose = require('mongoose');

const neighborhoodSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    municipalityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Municipality', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Neighborhood', neighborhoodSchema);
