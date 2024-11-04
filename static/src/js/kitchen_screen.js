/** @odoo-module */

import { registry } from "@web/core/registry";
const { Component, onWillStart, useState, onMounted, onWillUnmount } = owl;
import { useService } from "@web/core/utils/hooks";

class kitchen_screen_dashboard extends Component {
    setup() {
        super.setup();
        
        // Request notification permission on component mount
        onMounted(() => {
            if (Notification.permission === "default") {
                Notification.requestPermission();
            }
        });
        
        // Initialize notification sound
        this.notificationSound = new Audio('/pos_kitchen_screen/static/src/sounds/notification.mp3');
        
        // Bus service for real-time updates
        this.busService = this.env.services.bus_service;
        this.busService.addChannel("pos_order_created");
        this.busService.addChannel("pos_order_updated");  // Add channel for order updates
        
        // Event listeners for real-time updates
        onWillStart(() => {
            this.busService.addEventListener('notification', this.onPosOrderCreation.bind(this));
        });
        
        // Services
        this.action = useService("action");
        this.rpc = this.env.services.rpc;
        this.orm = useService("orm");
        
        // State management
        this.state = useState({
            order_details: [],
            shop_id: [],
            stages: 'draft',
            draft_count: [],
            waiting_count: [],
            ready_count: [],
            lines: [],
            lastUpdate: new Date(),  // Track last update time
        });

        // Initialize data
        this._initializeData();
        
        // Set up both short and long polling intervals
        this.shortPollingInterval = setInterval(() => {
            this.fetchNewOrders();
        }, 5000);  // Quick updates every 5 seconds
        
        this.longPollingInterval = setInterval(() => {
            this._initializeData();  // Full refresh every minute
        }, 60000);
    }

    async _initializeData() {
        const session_shop_id = this._getShopId();
        const result = await this.orm.call("pos.order", "get_details", ["", session_shop_id, ""]);
        this._updateState(result);
    }

    _getShopId() {
        if (this.props.action.context.default_shop_id) {
            sessionStorage.setItem('shop_id', this.props.action.context.default_shop_id);
            this.shop_id = this.props.action.context.default_shop_id;
        } else {
            this.shop_id = parseInt(sessionStorage.getItem('shop_id'), 10);
        }
        return this.shop_id;
    }

    _updateState(result) {
        this.state.order_details = result['orders'];
        this.state.lines = result['order_lines'];
        this.state.shop_id = this.shop_id;
        this.state.draft_count = this.state.order_details.filter(
            (order) => order.order_status == 'draft' && order.config_id[0] == this.state.shop_id
        ).length;
        this.state.waiting_count = this.state.order_details.filter(
            (order) => order.order_status == 'waiting' && order.config_id[0] == this.state.shop_id
        ).length;
        this.state.ready_count = this.state.order_details.filter(
            (order) => order.order_status == 'ready' && order.config_id[0] == this.state.shop_id
        ).length;
        this.state.lastUpdate = new Date();
    }

    async fetchNewOrders() {
        try {
            const result = await this.orm.call("pos.order", "get_kitchen_orders", [this.state.shop_id]);
            if (result && result.orders) {
                this._updateState(result);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    }

    onWillUnmount() {
        // Clean up all intervals
        if (this.shortPollingInterval) {
            clearInterval(this.shortPollingInterval);
        }
        if (this.longPollingInterval) {
            clearInterval(this.longPollingInterval);
        }
    }

    //Calling the onPosOrderCreation when an order is created or edited on the backend and return the notification
    async onPosOrderCreation(message) {
        let payload = message.detail[0].payload
        var self = this
        if(payload.message == "pos_order_created" && payload.res_model == "pos.order") {
            // Play notification sound for new order
            try {
                await this.notificationSound.play();
            } catch (error) {
                console.warn('Could not play notification sound:', error);
            }

            // Show browser notification for new order
            if (Notification.permission === "granted") {
                new Notification("New Kitchen Order", {
                    body: "A new order has arrived in the kitchen!",
                    icon: "/pos_kitchen_screen/static/description/icon.png",
                    tag: "new-order",
                    vibrate: [200, 100, 200]
                });
            }

            // Show toast notification
            this.env.services.notification.add("New order has arrived!", {
                type: 'info',
                sticky: false,
                className: 'o_pos_kitchen_notification',
                title: 'New Kitchen Order',
                timeout: 5000,
            });

            // Update the orders list
            await self.orm.call("pos.order", "get_details", ["", self.shop_id,""]).then(function(result) {
                self.state.order_details = result['orders']
                self.state.lines = result['order_lines']
                self.state.shop_id = self.shop_id
                self.state.draft_count = self.state.order_details.filter((order) => order.order_status=='draft' && order.config_id[0]==self.state.shop_id).length
                self.state.waiting_count = self.state.order_details.filter((order) => order.order_status=='waiting' && order.config_id[0]==self.state.shop_id).length
                self.state.ready_count = self.state.order_details.filter((order) => order.order_status=='ready' && order.config_id[0]==self.state.shop_id).length
            });

            // Add visual highlight effect to new orders
            setTimeout(() => {
                const newOrderElements = document.querySelectorAll('.new-order');
                newOrderElements.forEach(element => {
                    element.classList.add('order-highlight');
                });
            }, 100);
        }
    }

    // Add notification helper method
    async _notifyStatusChange(message) {
        try {
            await this.notificationSound.play();
        } catch (error) {
            console.warn('Could not play notification sound:', error);
        }

        if (Notification.permission === "granted") {
            new Notification("Kitchen Order Update", {
                body: message,
                icon: "/pos_kitchen_screen/static/description/icon.png"
            });
        }

        this.env.services.notification.add(message, {
            type: 'info',
            sticky: false,
            className: 'o_pos_kitchen_notification',
            title: 'Kitchen Order Update',
            timeout: 3000,
        });
    }

    // cancel the order from the kitchen
    async cancel_order(e) {
         var input_id = $("#" + e.target.id).val();
         await this.orm.call("pos.order", "order_progress_cancel", [Number(input_id)])
         var current_order = this.state.order_details.filter((order) => order.id==input_id)
         if(current_order){
            current_order[0].order_status = 'cancel'
            await this._notifyStatusChange(`Order ${current_order[0].name} has been cancelled`);
         }
    }
    // accept the order from the kitchen
        async accept_order(e) {
        var input_id = $("#" + e.target.id).val();
        ScrollReveal().reveal("#" + e.target.id, {
            delay: 1000,
            duration: 2000,
            opacity: 0,
            distance: "50%",
            origin: "top",
            reset: true,
            interval: 600,
        });
         var self=this
         await this.orm.call("pos.order", "order_progress_draft", [Number(input_id)])
         var current_order = this.state.order_details.filter((order) => order.id==input_id)
         if(current_order){
            current_order[0].order_status = 'waiting'
            await this._notifyStatusChange(`Order ${current_order[0].name} is now being prepared`);
         }
    }
    // set the stage is ready to see the completed stage orders
    ready_stage(e) {
        var self = this;
        self.state.stages = 'ready';
    }
    //set the stage is waiting to see the ready stage orders
    waiting_stage(e) {
        var self = this;
        self.state.stages = 'waiting';
    }
    //set the stage is draft to see the cooking stage orders
    draft_stage(e) {
        var self = this;
        self.state.stages = 'draft';
    }
    // change the status of the order from the kitchen
    async done_order(e) {
        var input_id = $("#" + e.target.id).val();
        await this.orm.call("pos.order", "order_progress_change", [Number(input_id)])
        var current_order = this.state.order_details.filter((order) => order.id==input_id)
         if(current_order){
            current_order[0].order_status = 'ready'
            await this._notifyStatusChange(`Order ${current_order[0].name} is ready!`);
         }
    }
    // change the status of the product from the kitchen
    async accept_order_line(e) {
        var input_id = $("#" + e.target.id).val();
        await this.orm.call("pos.order.line", "order_progress_change", [Number(input_id)])
        var current_order_line=this.state.lines.filter((order_line) => order_line.id==input_id)
        if (current_order_line){
            if (current_order_line[0].order_status == 'ready'){
                current_order_line[0].order_status = 'waiting'
                await this._notifyStatusChange(`Item ${current_order_line[0].name} is being prepared`);
            }
            else{
                current_order_line[0].order_status = 'ready'
                await this._notifyStatusChange(`Item ${current_order_line[0].name} is ready!`);
            }
        }
    }

}
kitchen_screen_dashboard.template = 'KitchenCustomDashBoard';
registry.category("actions").add("kitchen_custom_dashboard_tags", kitchen_screen_dashboard);