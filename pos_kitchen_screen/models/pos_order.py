from odoo import models, api

class PosOrder(models.Model):
    _inherit = 'pos.order'

    @api.model
    def update_kitchen_order_status(self, order_uid, values):
        order = self.search([('pos_reference', 'like', f'%{order_uid}%')], limit=1)
        if order:
            return order.write(values)
        return False 