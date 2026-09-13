package com.cyl.h5.service;
import com.cyl.h5.domain.form.CancelOrderForm;
import com.cyl.manager.oms.domain.entity.Order;
import com.cyl.manager.oms.domain.entity.OrderItem;
import com.cyl.manager.oms.mapper.OrderMapper;
import com.cyl.manager.oms.mapper.OrderItemMapper;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.Collections;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.junit.jupiter.api.Assertions.*;
class OrderCancellationTest {
 @Test void paidOrderCannotBeCancelled() {
  H5OrderService service=new H5OrderService();
  OrderMapper orders=mock(OrderMapper.class); OrderItemMapper items=mock(OrderItemMapper.class);
  ReflectionTestUtils.setField(service,"orderMapper",orders); ReflectionTestUtils.setField(service,"orderItemMapper",items);
  Order order=new Order();order.setId(1L);order.setStatus(1);
  when(orders.selectList(any())).thenReturn(Collections.singletonList(order));
  when(items.selectList(any())).thenReturn(Collections.singletonList(new OrderItem()));
  CancelOrderForm form=new CancelOrderForm();form.setIdList(Collections.singletonList(1L));
  assertThrows(RuntimeException.class,()->service.orderBatchCancel(form,null));
  verify(orders,never()).cancelBatch(anyList());
 }
 @Test void missingOrderCannotBeCancelled() {
  H5OrderService service=new H5OrderService();OrderMapper orders=mock(OrderMapper.class);
  ReflectionTestUtils.setField(service,"orderMapper",orders);
  when(orders.selectList(any())).thenReturn(Collections.emptyList());
  CancelOrderForm form=new CancelOrderForm();form.setIdList(Collections.singletonList(1L));
  assertThrows(RuntimeException.class,()->service.orderBatchCancel(form,7L));
  verify(orders,never()).cancelBatch(anyList());
 }
}
