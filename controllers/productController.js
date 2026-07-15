/**
 * Product Controller
 * Versi better-sqlite3
 */

const { db } = require('../config/database');
const { validateProduct, isValidCategory, sanitizeString } = require('../utils/validators');

/**
 * Mengambil semua produk dengan filter kategori opsional
 */
function getAllProducts(req, res) {
  try {
    const category = req.query.category;
    
    let sql = 'SELECT * FROM products';
    let params = [];
    
    if (category && category !== 'all') {
      sql += ' WHERE category = ?';
      params.push(category);
    }
    sql += ' ORDER BY id DESC';
    
    const stmt = db.prepare(sql);
    const rows = stmt.all(params); // <-- ganti db.all
    
    res.json(rows);
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Mengambil produk berdasarkan ID
 */
function getProductById(req, res) {
  try {
    const id = req.params.id;
    
    const stmt = db.prepare('SELECT * FROM products WHERE id = ?');
    const row = stmt.get(id); // <-- ganti db.get
    
    if (!row) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(row);
  } catch (error) {
    console.error('Error in getProductById:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Membuat produk baru
 */
function createProduct(req, res) {
  try {
    const { name, category, price, specs, image } = req.body;
    
    const sanitizedData = {
      name: sanitizeString(name || ''),
      category: sanitizeString(category || ''),
      specs: sanitizeString(specs || ''), // tadi typo: spec
      image: sanitizeString(image || ''),
      price: parseFloat(price) || 0
    };
    
    const validation = validateProduct(sanitizedData);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Data produk tidak valid',
        details: validation.errors 
      });
    }
    
    if (!isValidCategory(sanitizedData.category)) {
      return res.status(400).json({ 
        error: 'Kategori tidak valid',
        validCategories: ['k1', 'k2', 'k3', 'k4', 'other']
      });
    }
    
    const stmt = db.prepare(`
      INSERT INTO products (name, category, price, modal, specs, image)
      VALUES (?, ?, ?)
    `);
    
    const info = stmt.run( // <-- ganti db.run
      sanitizedData.name, 
      sanitizedData.category, 
      sanitizedData.price,
      0, // modal default
      sanitizedData.specs, 
      sanitizedData.image
    );
    
    res.status(201).json({
      id: info.lastInsertRowid, // <-- ganti this.lastID
      ...sanitizedData
    });
  } catch (error) {
    console.error('Error in createProduct:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Update produk
 */
function updateProduct(req, res) {
  try {
    const id = req.params.id;
    const { name, category, price, specs, image } = req.body;
    
    const sanitizedData = {
      name: sanitizeString(name || ''),
      category: sanitizeString(category || ''),
      specs: sanitizeString(specs || ''),
      image: sanitizeString(image || ''),
      price: parseFloat(price) || 0
    };
    
    const validation = validateProduct(sanitizedData);
    if (!validation.isValid) {
      return res.status(400).json({ error: 'Data produk tidak valid', details: validation.errors });
    }
    
    const stmt = db.prepare(`
      UPDATE products
      SET name = ?, category = ?, price = ?, specs = ?, image = ?
      WHERE id = ?
    `);
    
    const info = stmt.run(
      sanitizedData.name, sanitizedData.category, sanitizedData.price, 
      sanitizedData.specs, sanitizedData.image, id
    );
    
    if (info.changes === 0) { // <-- ganti this.changes
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ id: parseInt(id), ...sanitizedData });
  } catch (error) {
    console.error('Error in updateProduct:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Hapus produk
 */
function deleteProduct(req, res) {
  try {
    const id = req.params.id;
    
    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    const info = stmt.run(id);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error in deleteProduct:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Ambil kategori unik
 */
function getCategories(req, res) {
  try {
    const stmt = db.prepare('SELECT DISTINCT category FROM products');
    const rows = stmt.all();
    const categories = rows.map(row => row.category);
    res.json(categories);
  } catch (error) {
    console.error('Error in getCategories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Ambil varian produk
 */
function getProductVariants(req, res) {
  try {
    const category = req.query.category;
    let sql = `
      SELECT id, product_id, category, nama_varian, harga, specs, image
      FROM product_varian
      WHERE is_active = 1
    `;
    const params = [];

    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }
    sql += ' ORDER BY category, nama_varian ASC';

    const stmt = db.prepare(sql);
    const rows = stmt.all(params);
    res.json(rows);
  } catch (error) {
    console.error('Error in getProductVariants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getProductVariants
};
