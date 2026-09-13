import request from '@/utils/request'

// 订单分页列表（status: 0待付款 1待发货 2已发货 3已完成 4已关闭，不传=全部）
export function page(status, page = 0, size = 10) {
  return request({
    url: '/h5/order/page',
    method: 'get',
    params: { status, page, size }
  })
}

// 订单详情
export function detail(orderId) {
  return request({
    url: '/h5/order/orderDetail',
    method: 'get',
    params: { orderId }
  })
}

// 下单前校验/算价
export function addOrderCheck(data) {
  return request({
    url: '/h5/order/addOrderCheck',
    method: 'post',
    data
  })
}

// 提交订单 OrderSubmitForm {addressId,note,payType=2,from='cart',skuList:[{skuId,quantity}]}
export function add(data) {
  return request({
    url: '/h5/order/add',
    method: 'post',
    data
  })
}

// 支付 OrderPayForm {payId,type}
export function pay(data) {
  return request({
    url: '/h5/order/orderPay',
    method: 'post',
    data
  })
}

// 确认收货
export function complete(orderId) {
  return request({
    url: '/h5/order/orderComplete',
    method: 'get',
    params: { orderId }
  })
}

// 取消订单 CancelOrderForm {idList:[...]}
export function cancel(idList) {
  return request({
    url: '/h5/order/orderCancel',
    method: 'post',
    data: { idList }
  })
}

// 各状态订单数量统计
export function countOrder() {
  return request({
    url: '/h5/order/countOrder',
    method: 'get'
  })
}

export const applyRefund = data => request({ url: '/h5/order/applyRefund', method: 'post', data })
export const refundDetail = orderId => request({ url: '/h5/order/refundOrderDetail', params: { orderId } })
export const cancelRefund = orderId => request({ url: '/h5/order/cancelRefund', params: { orderId } })
export const returnDelivery = data => request({ url: '/h5/order/aftersale/delivery', method: 'post', data })
