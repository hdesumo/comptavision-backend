'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_license_status') THEN
          CREATE TYPE enum_license_status AS ENUM ('active','expired','suspended');
        END IF;
      END$$;
    `);

    await queryInterface.createTable('licenses', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      license_key: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      client_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      max_users: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5,
      },
      status: {
        type: 'enum_license_status',
        allowNull: false,
        defaultValue: 'active',
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('licenses', ['license_key'], {
      name: 'idx_licenses_license_key',
    });

    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION set_timestamp() RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS set_timestamp_on_licenses ON licenses;
      CREATE TRIGGER set_timestamp_on_licenses
      BEFORE UPDATE ON licenses
      FOR EACH ROW EXECUTE PROCEDURE set_timestamp();
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('licenses');
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS enum_license_status;`);
  }
};

