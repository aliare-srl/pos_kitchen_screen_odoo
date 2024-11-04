/** @odoo-module */

import { ActionpadWidget } from "@point_of_sale/js/Screens/ProductScreen/ActionpadWidget";
import { Registries } from "@point_of_sale/js/registries";

const KitchenActionpadWidget = (ActionpadWidget) => class extends ActionpadWidget {
    async submitOrder(options) {
        const order = this.env.pos.get_order();
        if (order) {
            try {
                // First notify kitchen
                await this.env.pos.sendOrderInPreparationUpdateLastChange(order);
                // Then proceed with normal order submission
                return super.submitOrder(options);
            } catch (error) {
                console.error('Error submitting order to kitchen:', error);
                // Still allow order to proceed even if kitchen update fails
                return super.submitOrder(options);
            }
        }
        return super.submitOrder(options);
    }
}

Registries.Component.extend(ActionpadWidget, KitchenActionpadWidget); 