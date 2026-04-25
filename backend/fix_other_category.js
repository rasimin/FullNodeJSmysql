require('dotenv').config();
const { DocumentType } = require('./src/models');

const fixOtherCategory = async () => {
    try {
        const [updatedCount] = await DocumentType.update(
            { category: 'All' },
            {
                where: {
                    code: 'OTHER'
                }
            }
        );

        console.log(`Successfully updated ${updatedCount} document types to category 'All'.`);
        process.exit(0);
    } catch (error) {
        console.error('Update failed:', error);
        process.exit(1);
    }
};

fixOtherCategory();
