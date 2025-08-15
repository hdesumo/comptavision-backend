const prisma = require('../../lib/prisma');

const lic = await prisma.licenses.create({
  data: {
    license_key,
    client_id,
    max_users,
    end_date
  }
});

