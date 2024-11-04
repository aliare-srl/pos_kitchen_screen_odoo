from odoo import models, api, fields

class PosOrder(models.Model):
    _inherit = 'pos.order'
    
    preparation_time = fields.Datetime('Preparation Time')
    kitchen_state = fields.Selection([
        ('new', 'New'),
        ('in_preparation', 'In Preparation'),
        ('done', 'Done')
    ], default='new', string='Kitchen Status')

    @api.model
    def update_kitchen_order_status(self, order_uid, values):
        order = self.search([('pos_reference', 'like', f'%{order_uid}%')], limit=1)
        if order:
            return order.write({
                'kitchen_state': values.get('state'),
                'preparation_time': values.get('preparation_time'),
            })
        return False 