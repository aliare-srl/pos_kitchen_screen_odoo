def get_kitchen_orders(self, shop_id=False):
    domain = []
    if shop_id:
        domain.append(('config_id', '=', shop_id))
    
    orders = self.search(domain)
    return {
        'orders': orders.read(['name', 'order_status', 'config_id']),
        'order_lines': orders.mapped('lines').read(['name', 'order_status', 'product_id'])
    } 