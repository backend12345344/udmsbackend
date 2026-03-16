const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Disaster = require('../models/Disaster');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// POST /api/reports - Submit disaster report
router.post('/', protect, async (req, res) => {
  try {
    const report = await Report.create({ ...req.body, reportedBy: req.user._id });
    res.status(201).json({ success: true, message: 'Report submitted successfully. Thank you!', report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/reports - Get all reports (admin)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let query = {};
    if (status) query.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Report.countDocuments(query);
    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .skip(skip).limit(parseInt(limit))
      .populate('reportedBy', 'name mobile');
    res.json({ success: true, total, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/reports/my - User's own reports
router.get('/my', protect, async (req, res) => {
  try {
    const reports = await Report.find({ reportedBy: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/reports/:id/verify - Admin verifies/rejects report
router.put('/:id/verify', protect, adminOnly, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status, adminNote, reviewedBy: req.user._id },
      { new: true }
    );

    // If verified, optionally convert to official disaster
    if (status === 'converted') {
      const disaster = await Disaster.create({
        title: report.title,
        type: report.disasterType,
        description: report.description,
        location: report.location,
        severity: report.severity,
        source: 'user_report',
        reportedBy: report.reportedBy,
        verifiedBy: req.user._id,
        isVerified: true,
        images: report.images.map(url => ({ url }))
      });
      report.convertedToDisaster = disaster._id;
      await report.save();
    }

    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
