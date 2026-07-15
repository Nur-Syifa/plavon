/**
 * Product Controller
 * 
 * Menangani semua operasi CRUD untuk produk dan varian produk.
 * Termasuk get, create, update, delete, dan filtering.
 */

const { db } = require('../config/database');
const { validateProduct, isValidCategory, sanitizeString } = require('../utils/validators');

/**
 * Mengambil semua produk dengan filter kategori opsional
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getAllProducts(req, res) {
  try {
    const category = req.query.category;
    
    let sql = 'SELECT * FROM products';
    let params = [];
    
    if (category && category !== 'all') {
      sql += ' WHERE category = ?';
      params.push(category);
    }
    
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Error fetching products:', err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    });
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Mengambil produk berdasarkan ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getProductById(req, res) {
  try {
    const id = req.params.id;
    
    db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Error fetching product:', err.message);
        return res.status(500).json({ error: err.message });
      }
      
      if (!row) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      res.json(row);
    });
  } catch (error) {
    console.error('Error in getProductById:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Membuat produk baru
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function createProduct(req, res) {
  try {
    const { name, category, price, specs, image } = req.body;
    
    // Sanitasi dan validasi input
    const sanitizedData = {
      name: sanitizeString(name || ''),
      category: sanitizeString(category || ''),
      specs: sanitizeString(spec || ''),
      image: sanitizeString(image || ''),
      price: parseFloat(price) || 0
    };
    
    // Gunakan validator
    const validation = validateProduct(sanitizedData);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Data produk tidak valid',
        details: validation.errors 
      });
    }
    
    // Validasi kategori
    if (!isValidCategory(sanitizedData.category)) {
      return res.status(400).json({ 
        error: 'Kategori tidak valid',
        validCategories: ['k1', 'k2', 'k3', 'k4', 'other']
      });
    }
    
    const sql = `
      INSERT INTO products (name, category, price, specs, image)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    db.run(sql, [
      sanitizedData.name, 
      sanitizedData.category, 
      sanitizedData.price, 
      sanitizedData.specs, 
      sanitizedData.image
    ], function(err) {
      if (err) {
        console.error('Error adding product:', err.message);
        return res.status(500).json({ error: err.message });
      }
      
      res.status(201).json({
        id: this.lastID,
        name: sanitizedData.name,
        category: sanitizedData.category,
        price: sanitizedData.price,
        specs: sanitizedData.specs,
        image: sanitizedData.image
      });
    });
  } catch (error) {
    console.error('Error in createProduct:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Update produk yang sudah ada
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function updateProduct(req, res) {
  try {
    const id = req.params.id;
    const { name, category, price, specs, image } = req.body;
    
    // Sanitasi dan validasi input
    const sanitizedData = {
      name: sanitizeString(name || ''),
      category: sanitizeString(category || ''),
      specs: sanitizeString(specs || ''),
      image: sanitizeString(image || ''),
      price: parseFloat(price) || 0
    };
    
    // Gunakan validator
    const validation = validateProduct(sanitizedData);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Data produk tidak valid',
        details: validation.errors 
      });
    }
    
    // Validasi kategori
    if (!isValidCategory(sanitizedData.category)) {
      return res.status(400).json({ 
        error: 'Kategori tidak valid',
        validCategories: ['k1', 'k2', 'k3', 'k4', 'other']
      });
    }
    
    const sql = `
      UPDATE products
      SET name = ?, category = ?, price = ?, specs = ?, image = ?
      WHERE id = ?
    `;
    
    db.run(sql, [
      sanitizedData.name, 
      sanitizedData.category, 
      sanitizedData.price, 
      sanitizedData.specs, 
      sanitizedData.image, 
      id
    ], function(err) {
      if (err) {
        console.error('Error updating product:', err.message);
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      res.json({
        id: parseInt(id),
        name: sanitizedData.name,
        category: sanitizedData.category,
        price: sanitizedData.price,
        specs: sanitizedData.specs,
        image: sanitizedData.image
      });
    });
  } catch (error) {
    console.error('Error in updateProduct:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Menghapus produk berdasarkan ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function deleteProduct(req, res) {
  try {
    const id = req.params.id;
    
    db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Error deleting product:', err.message);
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      res.json({ message: 'Product deleted successfully' });
    });
  } catch (error) {
    console.error('Error in deleteProduct:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Mengambil semua kategori produk unik
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getCategories(req, res) {
  try {
    db.all('SELECT DISTINCT category FROM products', [], (err, rows) => {
      if (err) {
        console.error('Error fetching categories:', err.message);
        return res.status(500).json({ error: err.message });
      }
      
      const categories = rows.map(row => row.category);
      res.json(categories);
    });
  } catch (error) {
    console.error('Error in getCategories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Mengambil varian produk untuk modal "All Products"
 * Mendukung filter berdasarkan kategori
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getProductVariants(req, res) {
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

    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Error fetching product variants:', err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    });
  } catch (error) {
    console.error('Error in getProductVariants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Export semua fungsi controller
module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getProductVariants
};