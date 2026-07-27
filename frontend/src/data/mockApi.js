const products = [
  { id: 1, name: 'Widget A', sku: 'WID-A', price: 9.99, stock: 120 },
  { id: 2, name: 'Widget B', sku: 'WID-B', price: 14.99, stock: 80 },
  { id: 3, name: 'Gadget C', sku: 'GAD-C', price: 24.5, stock: 40 }
]

const inventory = [
  { id: 1, location: 'Warehouse 1', productId: 1, quantity: 60 },
  { id: 2, location: 'Warehouse 2', productId: 1, quantity: 60 },
  { id: 3, location: 'Warehouse 1', productId: 2, quantity: 80 }
]

function delay(result, ms = 250) {
  return new Promise((res) => setTimeout(() => res(result), ms))
}

export function getProducts() {
  return delay(products.slice())
}

export function getInventory() {
  return delay(inventory.slice())
}

export function getProductById(id) {
  return delay(products.find((p) => p.id === Number(id)))
}
