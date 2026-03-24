const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Catalogs
router.get('/provinces', adminController.getProvinces);
router.post('/provinces', adminController.createProvince);
router.put('/provinces/:id', adminController.updateProvince);
router.delete('/provinces/:id', adminController.deleteProvince);

router.get('/municipalities', adminController.getMunicipalities);
router.post('/municipalities', adminController.createMunicipality);
router.put('/municipalities/:id', adminController.updateMunicipality);
router.delete('/municipalities/:id', adminController.deleteMunicipality);

router.get('/neighborhoods', adminController.getNeighborhoods);
router.post('/neighborhoods', adminController.createNeighborhood);
router.put('/neighborhoods/:id', adminController.updateNeighborhood);
router.delete('/neighborhoods/:id', adminController.deleteNeighborhood);

router.get('/incident-types', adminController.getIncidentTypes);
router.post('/incident-types', adminController.createIncidentType);
router.put('/incident-types/:id', adminController.updateIncidentType);
router.delete('/incident-types/:id', adminController.deleteIncidentType);

// Validations
router.get('/incidents/pending', adminController.getPendingIncidents);
router.put('/incidents/:id/publish', adminController.publishIncident);
router.put('/incidents/:id/reject', adminController.rejectIncident);

// Merge
router.post('/incidents/merge', adminController.mergeIncidents);

// Stats
router.get('/stats', adminController.getStats);

module.exports = router;
