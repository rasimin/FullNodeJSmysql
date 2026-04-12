const { Office } = require('../models');

const createOffice = async (req, res) => {
  try {
    const { name, type, address, parent_id } = req.body;
    
    // Validate hierarchy
    if (type === 'BRANCH_OFFICE' && !parent_id) {
      return res.status(400).json({ message: 'Branch Office must have a Parent Office (Head Office)' });
    }

    const office = await Office.create(
      { name, type, address, parent_id },
      { userId: req.user.id }
    );
    res.status(201).json(office);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOffices = async (req, res) => {
  try {
    const offices = await Office.findAll({
      include: [
        {
          model: Office,
          as: 'parent',
          attributes: ['id', 'name']
        },
        {
          model: Office,
          as: 'branches',
          attributes: ['id', 'name']
        }
      ]
    });
    res.json(offices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOffice = async (req, res) => {
  try {
    const { id } = req.params;
    const office = await Office.findByPk(id);

    if (!office) return res.status(404).json({ message: 'Office not found' });

    await office.update(req.body, { userId: req.user.id });
    res.json(office);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteOffice = async (req, res) => {
  try {
    const { id } = req.params;
    const office = await Office.findByPk(id);

    if (!office) return res.status(404).json({ message: 'Office not found' });

    // Prevent deletion if it has branches or users attached (though FK constraints might handle this, it's good to be explicit)
    const branches = await Office.count({ where: { parent_id: id } });
    if (branches > 0) {
      return res.status(400).json({ message: 'Cannot delete Office with existing branches' });
    }

    await office.destroy({ userId: req.user.id });
    res.json({ message: 'Office deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOffice,
  getOffices,
  updateOffice,
  deleteOffice
};
