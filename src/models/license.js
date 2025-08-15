'use strict';
module.exports = (sequelize, DataTypes) => {
  const License = sequelize.define('License', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4, // côté app (la DB a déjà gen_random_uuid())
    },
    license_key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    max_users: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
    },
    status: {
      type: DataTypes.ENUM('active', 'expired', 'suspended'),
      allowNull: false,
      defaultValue: 'active',
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    tableName: 'licenses',
    underscored: true, // mappe created_at/updated_at
  });

  return License;
};

