/** @odoo-module */

import { PosGlobalState } from "@point_of_sale/js/models";
import { Registries } from "@point_of_sale/js/registries";

const KitchenPosModel = (PosGlobalState) => class KitchenPosModel extends PosGlobalState {
    async sendOrderInPreparationUpdateLastChange(order) {
        try {
            // Send order to kitchen
            const result = await this.env.services.rpc({
                model: 'pos.order',
                method: 'update_kitchen_order_status',
                args: [[order.uid], {
                    state: 'in_preparation',
                    preparation_time: new Date().toISOString(),
                }],
            });
            
            // Trigger kitchen screen update
            this.trigger('order-preparation-change', { uid: order.uid });
            
            return result;
        } catch (error) {
            console.error('Failed to update kitchen order status:', error);
            return false;
        }
    }
}

Registries.Model.extend(PosGlobalState, KitchenPosModel); 