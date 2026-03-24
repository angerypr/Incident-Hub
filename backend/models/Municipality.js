const mongoose = require('mongoose');

const municipalitySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    provinceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Province', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Municipality', municipalitySchema);
