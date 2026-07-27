import React from "react";
import Card from "../common/Card";

export default function TopSellingProducts({ products = [] }){

return(

<Card
title="Top Selling Products"
subtitle="Best performers this month"
className="panel-card"
>

<div className="top-products">

{products.length === 0 ? (
  <div style={{ color: 'var(--muted)', fontSize: '0.9rem', padding: '16px 0', textAlign: 'center', width: '100%' }}>
    No sales recorded yet.
  </div>
) : (
  products.map((item)=>(

  <div
    key={item.name}
    className="top-product"
  >

  <span>{item.name}</span>

  <strong>{item.sold}</strong>

  </div>

  ))
)}

</div>

</Card>

);

}