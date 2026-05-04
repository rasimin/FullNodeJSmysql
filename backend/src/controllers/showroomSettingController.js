const { ShowroomSetting, Office } = require('../models');

exports.getShowroomSetting = async (req, res) => {
  try {
    const { officeId } = req.query;
    const userRole = req.user.Role?.name;
    // If not super admin, restrict to user's office
    const targetOfficeId = userRole === 'Super Admin' ? (officeId || req.user.office_id) : req.user.office_id;

    if (!targetOfficeId) return res.status(400).json({ message: 'Office ID required' });

    const office = await Office.findByPk(targetOfficeId);
    if (!office) return res.status(404).json({ message: 'Office not found' });
    
    const headOfficeId = office.type === 'HEAD_OFFICE' ? office.id : office.parent_id;
    if (!headOfficeId) return res.status(400).json({ message: 'Office must belong to a Head Office' });

    let [setting] = await ShowroomSetting.findOrCreate({
      where: { head_office_id: headOfficeId },
      defaults: {
        slug: `showroom-${headOfficeId}`,
        title: 'Katalog Showroom',
        description: 'Temukan unit impian Anda dengan standar kualitas terbaik dan proses yang transparan.',
        is_published: false
      },
      include: [{ model: Office, as: 'office' }]
    });

    // If it was just created, we might need to fetch it again to get the included office
    if (!setting.office) {
        setting = await ShowroomSetting.findOne({
            where: { head_office_id: headOfficeId },
            include: [{ model: Office, as: 'office' }]
        });
    }

    res.json(setting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateShowroomSetting = async (req, res) => {
  try {
    const { id } = req.params;
    const { slug, title, description, is_published } = req.body;

    const setting = await ShowroomSetting.findByPk(id);
    if (!setting) return res.status(404).json({ message: 'Setting not found' });

    // Auth check: Only super admin or user belonging to this Head Office
    const userRole = req.user.Role?.name;
    if (userRole !== 'Super Admin') {
        const userOffice = await Office.findByPk(req.user.office_id);
        const headOfficeId = userOffice.type === 'HEAD_OFFICE' ? userOffice.id : userOffice.parent_id;
        if (setting.head_office_id !== headOfficeId) {
            return res.status(403).json({ message: 'Unauthorized to update this showroom' });
        }
    }

    // Slug validation (unique)
    if (slug && slug !== setting.slug) {
        // Basic slug format validation
        if (!/^[a-z0-9-]+$/.test(slug)) {
            return res.status(400).json({ message: 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung (-)' });
        }
        const existing = await ShowroomSetting.findOne({ where: { slug } });
        if (existing) return res.status(400).json({ message: 'Slug sudah digunakan oleh showroom lain' });
    }

    await setting.update({ slug, title, description, is_published }, { userId: req.user.id });
    res.json({ message: 'Pengaturan berhasil disimpan', setting });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.checkSlugAvailability = async (req, res) => {
    try {
        const { slug } = req.query;
        if (!slug) return res.json({ available: true });
        const existing = await ShowroomSetting.findOne({ where: { slug } });
        res.json({ available: !existing });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
