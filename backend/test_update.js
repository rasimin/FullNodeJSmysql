const { Vehicle, User, Role } = require('./src/models');

async function testUpdate() {
  try {
    const vehicleId = 6; // From the screenshot
    const vehicle = await Vehicle.findByPk(vehicleId);
    if (!vehicle) {
      console.log("Vehicle not found");
      process.exit(0);
    }
    
    console.log("Found vehicle:", vehicle.brand, vehicle.model);
    
    // Simulate what the controller does
    const updateData = {
      price: "1000000",
      description: "Test update from script"
    };
    
    await vehicle.update(updateData, { 
      userId: 1, // Assuming admin user ID
      individualHooks: true 
    });
    
    console.log("Update successful!");
    process.exit(0);
  } catch (error) {
    console.error("Update failed with error:", error);
    process.exit(1);
  }
}

testUpdate();
