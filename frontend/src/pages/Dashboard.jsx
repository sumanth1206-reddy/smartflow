import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import PageHeader from '../components/common/PageHeader'
import StatCard from '../components/common/StatCard'
import Card from '../components/common/Card'
import Badge from '../components/common/Badge'
import Table from '../components/common/Table'
import Button from '../components/common/Button'
import { useTranslation } from 'react-i18next'
import { formatPrice, formatPriceNoDecimals } from '../utils/currency'

import AIInsights from "../components/dashboard/AIInsights";
import NotificationsPanel from "../components/dashboard/NotificationsPanel";
import TopSellingProducts from "../components/dashboard/TopSellingProducts";
import DemandForecast from "../components/dashboard/DemandForecast";
import Loader from '../components/common/Loader'
import api from '../services/api'

const quickActions = ["Add Product", "Manage Inventory", "Create Invoice", "Sales History", "Generate Report", "Settings"];

function InventoryMixChart({ data }) {
  const size = 128
  const stroke = 26
  const radius = (size - stroke) / 2
  const cx = size / 2
  const cy = size / 2

  let cumulativePercent = 0
  const activeSegments = data.filter((s) => s.value > 0)
  const healthySegment = data.find((d) => d.label === 'Healthy')
  const healthyValue = healthySegment ? healthySegment.value : 0

  return (
    <div className="chart-placeholder chart-donut">
      <svg viewBox={`0 0 ${size} ${size}`} className="inventory-svg">
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(148, 163, 184, 0.18)" strokeWidth={stroke} />
        {activeSegments.map((segment) => {
          const percent = segment.value / 100
          const startPercent = cumulativePercent
          cumulativePercent += percent
          const endPercent = cumulativePercent

          const startAngle = (startPercent * 2 * Math.PI) - (Math.PI / 2)
          const endAngle = (endPercent * 2 * Math.PI) - (Math.PI / 2)

          const startX = cx + radius * Math.cos(startAngle)
          const startY = cy + radius * Math.sin(startAngle)
          const endX = cx + radius * Math.cos(endAngle)
          const endY = cy + radius * Math.sin(endAngle)

          const largeArcFlag = percent > 0.5 ? 1 : 0

          if (percent >= 0.999) {
            return (
              <circle
                key={segment.label}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={stroke}
              />
            )
          }

          const pathData = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`

          return (
            <path
              key={segment.label}
              d={pathData}
              fill="none"
              stroke={segment.color}
              strokeWidth={stroke}
            />
          )
        })}
      </svg>
      <div className="donut-core">
        <strong>{healthyValue}%</strong>
        <span>Healthy</span>
      </div>
      <div className="inventory-legend">
        {data.map((segment) => (
          <div key={segment.label} className="inventory-legend-item">
            <span style={{ background: segment.color }} />
            <strong>{segment.label}</strong>
            <small>{segment.value}%</small>
          </div>
        ))}
      </div>
    </div>
  )
}

function MonthlySalesChart({ trendData = [] }) {
  if (!trendData || trendData.length === 0) {
    return <div style={{ color: 'var(--muted)', fontSize: '0.9rem', padding: '24px 0', textAlign: 'center' }}>No sales history available.</div>
  }
  const maxVal = Math.max(...trendData.map(d => Math.max(d.revenue, d.profit, 1)))
  const width = 500
  const height = 180
  const paddingLeft = 40
  const paddingRight = 10
  const paddingTop = 20
  const paddingBottom = 30
  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom

  const points = trendData.map((d, idx) => {
    const x = paddingLeft + (idx / (trendData.length - 1 || 1)) * chartWidth
    const y = paddingTop + chartHeight - (d.profit / maxVal) * chartHeight
    return { x, y }
  })
  const linePath = points.length > 0 ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') : ''

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '180px' }}>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
          const y = paddingTop + ratio * chartHeight
          const val = Math.round(maxVal * (1 - ratio))
          return (
            <g key={index}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="rgba(148, 163, 184, 0.1)" strokeDasharray="3 3" />
              <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fontSize="10" fill="var(--muted)">
                {val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
              </text>
            </g>
          )
        })}

        {trendData.map((d, idx) => {
          const barWidth = Math.min(24, chartWidth / (trendData.length * 1.5))
          const x = paddingLeft + (idx / (trendData.length - 1 || 1)) * chartWidth - barWidth / 2
          const barHeight = (d.revenue / maxVal) * chartHeight
          const y = paddingTop + chartHeight - barHeight

          return (
            <rect
              key={idx}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill="rgba(37, 99, 235, 0.85)"
              rx="3"
            >
              <title>{`Revenue: ${formatPrice(d.revenue)}`}</title>
            </rect>
          )
        })}

        {linePath && <path d={linePath} fill="none" stroke="var(--success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
        {points.map((p, idx) => (
          <circle key={idx} cx={p.x} cy={p.y} r="4" fill="var(--surface)" stroke="var(--success)" strokeWidth="2">
            <title>{`Profit: ${formatPrice(trendData[idx].profit)}`}</title>
          </circle>
        ))}

        {trendData.map((d, idx) => {
          const x = paddingLeft + (idx / (trendData.length - 1 || 1)) * chartWidth
          return (
            <text key={idx} x={x} y={height - 8} textAnchor="middle" fontSize="10" fill="var(--muted)">
              {d.month}
            </text>
          )
        })}
      </svg>
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '8px', fontSize: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '12px', height: '12px', background: 'rgba(37, 99, 235, 0.85)', borderRadius: '2px' }} />
          <span>Revenue</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '12px', height: '3px', background: 'var(--success)' }} />
          <span>Profit</span>
        </div>
      </div>
    </div>
  )
}

function WeeklySalesChart({ weeklyData = [] }) {
  if (!weeklyData || weeklyData.length === 0) {
    return <div style={{ color: 'var(--muted)', fontSize: '0.9rem', padding: '24px 0', textAlign: 'center' }}>No sales data.</div>
  }
  const maxVal = Math.max(...weeklyData.map(d => d.revenue), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', height: '140px', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
        {weeklyData.map((d, index) => {
          const heightPercent = `${(d.revenue / maxVal) * 100}%`
          return (
            <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
              <div
                style={{
                  height: heightPercent,
                  width: '100%',
                  minWidth: '12px',
                  background: 'var(--accent)',
                  borderRadius: '4px 4px 0 0',
                  position: 'relative'
                }}
              >
                <title>{`${d.date}: ${formatPrice(d.revenue)}`}</title>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
        {weeklyData.map((d, index) => (
          <span key={index} style={{ flex: 1, textAlign: 'center', fontSize: '0.75rem', color: 'var(--muted)' }}>
            {d.day}
          </span>
        ))}
      </div>
    </div>
  )
}

function InventoryTrendChart({ trendData = [] }) {
  if (!trendData || trendData.length === 0) {
    return <div style={{ color: 'var(--muted)', fontSize: '0.9rem', padding: '24px 0', textAlign: 'center' }}>No trend data.</div>
  }
  const maxVal = Math.max(...trendData.map(d => d.value), 1)
  const width = 300
  const height = 120
  const padding = 12
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  const points = trendData.map((d, idx) => {
    const x = padding + (idx / (trendData.length - 1 || 1)) * chartWidth
    const y = padding + chartHeight - (d.value / maxVal) * chartHeight
    return { x, y, ...d }
  })

  const pathD = points.length > 0 ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') : ''

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '140px' }}>
        {pathD && <path d={pathD} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
        {points.map((p, idx) => (
          <circle key={idx} cx={p.x} cy={p.y} r="4" fill="var(--surface)" stroke="var(--primary)" strokeWidth="2">
            <title>{`${p.date}: ${p.value} units`}</title>
          </circle>
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
        {trendData.filter((_, i) => i % 2 === 0).map((d, idx) => (
          <span key={idx} style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
            {d.date}
          </span>
        ))}
      </div>
    </div>
  )
}

function CategoryDistributionChart({ data = [] }) {
  if (!data || data.length === 0) {
    return <div style={{ color: 'var(--muted)', fontSize: '0.9rem', padding: '24px 0', textAlign: 'center' }}>No category data.</div>
  }
  const maxVal = Math.max(...data.map(c => c.value), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {data.slice(0, 5).map((c, index) => {
        const widthPercent = `${(c.value / maxVal) * 100}%`
        return (
          <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span>{c.name}</span>
              <strong>{c.value.toLocaleString()} units ({c.count} SKUs)</strong>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(148, 163, 184, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: widthPercent, height: '100%', background: 'var(--primary)', borderRadius: '4px' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [summary, setSummary] = useState(null)
  const [settings, setSettings] = useState(null)
  const [aiAnalytics, setAiAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  async function generatePDFReport() {
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()

      doc.setFillColor(37, 99, 235)
      doc.rect(0, 0, 210, 40, 'F')

      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text('SmartFlow Operations', 14, 23)

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(239, 246, 255)
      doc.text(`Executive Summary Report | Generated: ${new Date().toLocaleString()}`, 14, 30)

      let y = 52
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(15, 23, 42)
      doc.text('Key Performance Indicators', 14, y)

      y += 8
      doc.setFontSize(9)
      dynamicStats.forEach((stat, index) => {
        const col = index % 2
        const row = Math.floor(index / 2)
        const x = col * 92 + 14
        const currentY = y + row * 16

        doc.setFillColor(248, 250, 252)
        doc.setDrawColor(226, 232, 240)
        doc.roundedRect(x, currentY, 88, 12, 1, 1, 'FD')

        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 116, 139)
        doc.text(stat.title, x + 4, currentY + 4)

        const safeValue = String(stat.value || '')
          .replace(/₹/g, 'Rs. ')
          .replace(/€/g, 'EUR ')
          .replace(/£/g, 'GBP ')
          .replace(/¥/g, 'JPY ')

        doc.setFont('helvetica', 'bold')
        doc.setTextColor(15, 23, 42)
        doc.text(safeValue, x + 4, currentY + 9)

        // Draw detail next to the value in smaller, muted font, truncated to fit the remaining box width
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(148, 163, 184)
        const valueWidth = doc.getTextWidth(safeValue)
        let detailText = (stat.detail || '')
          .replace(/₹/g, 'Rs. ')
          .replace(/€/g, 'EUR ')
          .replace(/£/g, 'GBP ')
          .replace(/¥/g, 'JPY ')
        const maxDetailWidth = 88 - (valueWidth + 10)
        if (doc.getTextWidth(detailText) > maxDetailWidth) {
          while (detailText.length > 0 && doc.getTextWidth(detailText + '...') > maxDetailWidth) {
            detailText = detailText.slice(0, -1)
          }
          detailText = detailText + '...'
        }
        doc.text(detailText, x + 4 + valueWidth + 3, currentY + 9)
        doc.setFontSize(9)
      })

      y += 4 * 16 + 6
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(15, 23, 42)
      doc.text('Product Stock Level Breakdown', 14, y)

      y += 8
      doc.setFillColor(241, 245, 249)
      doc.rect(14, y, 182, 8, 'F')
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(51, 65, 85)
      doc.text('Product Name', 16, y + 6)
      doc.text('SKU', 84, y + 6)
      doc.text('Available Qty', 130, y + 6)
      doc.text('Alert Status', 168, y + 6)

      y += 8
      doc.setFont('helvetica', 'normal')
      products.forEach((p, idx) => {
        if (idx >= 15) return
        
        let status = 'In Stock'
        if (p.quantity === 0) status = 'Out of Stock'
        else if (p.quantity < (settings?.lowStockThreshold || 10)) status = 'Low Stock'

        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252)
          doc.rect(14, y, 182, 8, 'F')
        }

        doc.setTextColor(15, 23, 42)
        doc.text(p.name.length > 26 ? p.name.substring(0, 24) + '...' : p.name, 16, y + 6)
        doc.text(p.sku, 84, y + 6)
        doc.text(`${p.quantity} units`, 130, y + 6)

        if (status === 'Out of Stock') {
          doc.setTextColor(220, 38, 38)
        } else if (status === 'Low Stock') {
          doc.setTextColor(217, 119, 6)
        } else {
          doc.setTextColor(22, 163, 74)
        }
        doc.text(status, 168, y + 6)

        y += 8
      })

      y += 10
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(148, 163, 184)
      doc.text('Confidential - Internal SmartFlow Operations Report. All rights reserved.', 14, y)

      doc.save(`SmartFlow_Report_${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('Report PDF downloaded successfully!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate PDF report.')
    }
  }

  const handleQuickAction = (item) => {
    switch (item) {
      case 'Add Product':
        navigate('/products')
        break
      case 'Manage Inventory':
        navigate('/inventory')
        break
      case 'Create Invoice':
        navigate('/billing')
        break
      case 'Sales History':
        navigate('/sales')
        break
      case 'Generate Report':
        generatePDFReport()
        break
      case 'Settings':
        navigate('/settings')
        break
      default:
        break
    }
  }

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [prodRes, salesRes, summaryRes, settingsRes, aiRes] = await Promise.allSettled([
          api.get('/products'),
          api.get('/sales'),
          api.get('/dashboard/summary'),
          api.get('/settings'),
          api.get('/ai/analytics')
        ])

        const isBackendDown = prodRes.status === 'rejected' || salesRes.status === 'rejected' || summaryRes.status === 'rejected'

        const fallbackProducts = [
          { id: 1, name: 'Smart Flow Controller X', sku: 'SFC-001', quantity: 45, price: 299.99 },
          { id: 2, name: 'Wireless Sensor Node', sku: 'WSN-102', quantity: 8, price: 89.50 },
          { id: 3, name: 'Industrial Gateway Pro', sku: 'IGP-500', quantity: 0, price: 499.00 },
          { id: 4, name: 'Pressure Valve Assembly', sku: 'PVA-020', quantity: 120, price: 145.00 },
          { id: 5, name: 'Flow Meter Digital', sku: 'FMD-300', quantity: 5, price: 210.00 }
        ]

        const fallbackSales = [
          { id: 'INV-1001', customer: 'Acme Corp', total: 1250, status: 'Paid' },
          { id: 'INV-1002', customer: 'Global Tech', total: 890, status: 'Paid' },
          { id: 'INV-1003', customer: 'Apex Industries', total: 450, status: 'Pending' }
        ]

        const fallbackSummary = {
          totalProducts: 48,
          totalCategories: 6,
          totalSuppliers: 12,
          todaySalesRevenue: 4520,
          todaySalesCount: 14,
          inventoryValue: 128500,
          lowStockCount: 4,
          expiredCount: 1,
          totalRevenue: 248900,
          totalProfit: 84200,
          monthlySalesRevenue: 42100,
          monthlySalesCount: 128,
          recentActivities: [
            { id: 1, title: 'Stock Restocked', detail: 'Pressure Valve Assembly +50 units', time: '10m ago' },
            { id: 2, title: 'New Sale Recorded', detail: 'Invoice INV-1003 generated for Apex Industries', time: '45m ago' },
            { id: 3, title: 'Low Stock Alert', detail: 'Wireless Sensor Node dropped below threshold', time: '2h ago' }
          ],
          monthlySalesTrend: [
            { month: 'Jan', revenue: 28000, profit: 9500 },
            { month: 'Feb', revenue: 32000, profit: 11000 },
            { month: 'Mar', revenue: 38000, profit: 13200 },
            { month: 'Apr', revenue: 42100, profit: 14800 }
          ],
          weeklySales: [
            { day: 'Mon', date: 'Jul 22', revenue: 5400 },
            { day: 'Tue', date: 'Jul 23', revenue: 6200 },
            { day: 'Wed', date: 'Jul 24', revenue: 5800 },
            { day: 'Thu', date: 'Jul 25', revenue: 7100 },
            { day: 'Fri', date: 'Jul 26', revenue: 8400 },
            { day: 'Sat', date: 'Jul 27', revenue: 4900 },
            { day: 'Sun', date: 'Jul 28', revenue: 4520 }
          ],
          inventoryTrend: [
            { date: 'Mon', value: 180 },
            { date: 'Tue', value: 175 },
            { date: 'Wed', value: 190 },
            { date: 'Thu', value: 185 },
            { date: 'Fri', value: 210 },
            { date: 'Sat', value: 205 },
            { date: 'Sun', value: 198 }
          ],
          categoryDistribution: [
            { name: 'Sensors & Controllers', value: 1200, count: 18 },
            { name: 'Valves & Actuators', value: 850, count: 12 },
            { name: 'Gateways & Networking', value: 450, count: 8 },
            { name: 'Power & Accessories', value: 320, count: 10 }
          ],
          topSellingProducts: [
            { id: 1, name: 'Smart Flow Controller X', salesCount: 142, revenue: 42598 },
            { id: 2, name: 'Flow Meter Digital', salesCount: 98, revenue: 20580 }
          ]
        }

        const fallbackAi = {
          insights: [
            { id: 1, type: 'opportunity', title: 'High Demand Detected', description: 'Smart Flow Controller X sales increased by 28% this week.' },
            { id: 2, type: 'warning', title: 'Restock Recommended', description: 'Wireless Sensor Node will run out of stock in 3 days.' }
          ],
          demandForecast: [
            { date: 'Week 1', forecast: 120, actual: 115 },
            { date: 'Week 2', forecast: 135, actual: 130 },
            { date: 'Week 3', forecast: 150, actual: null }
          ],
          recommendations: [
            'Reorder 30 units of Wireless Sensor Node from primary supplier.',
            'Consider bulk discount on Smart Flow Controller X.'
          ]
        }

        const productsData = prodRes.status === 'fulfilled' && Array.isArray(prodRes.value?.data) && prodRes.value.data.length > 0 ? prodRes.value.data : (isBackendDown ? fallbackProducts : [])
        const salesData = salesRes.status === 'fulfilled' && Array.isArray(salesRes.value?.data) && salesRes.value.data.length > 0 ? salesRes.value.data : (isBackendDown ? fallbackSales : [])
        const summaryData = summaryRes.status === 'fulfilled' && summaryRes.value?.data && typeof summaryRes.value.data === 'object' && !Array.isArray(summaryRes.value.data) ? summaryRes.value.data : (isBackendDown ? fallbackSummary : null)
        const settingsData = settingsRes.status === 'fulfilled' && settingsRes.value?.data && typeof settingsRes.value.data === 'object' ? settingsRes.value.data : null
        const aiData = aiRes.status === 'fulfilled' && aiRes.value?.data && typeof aiRes.value.data === 'object' ? aiRes.value.data : (isBackendDown ? fallbackAi : null)

        setProducts(productsData)
        setSales(salesData)
        setSummary(summaryData)
        setSettings(settingsData)
        setAiAnalytics(aiData)
      } catch (error) {
        console.error('Failed to load dashboard metrics', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return <Loader label="Loading dashboard analytics..." />
  }

  const lowStockThreshold = settings?.lowStockThreshold || 10
  const healthyCount = products.filter((p) => p.quantity >= lowStockThreshold).length
  const watchCount = products.filter((p) => p.quantity > 0 && p.quantity < lowStockThreshold).length
  const lowCount = products.filter((p) => p.quantity === 0).length

  const total = products.length
  const healthyPercent = total > 0 ? Math.round((healthyCount / total) * 100) : 0
  const watchPercent = total > 0 ? Math.round((watchCount / total) * 100) : 0
  const lowPercent = total > 0 ? Math.round((lowCount / total) * 100) : 0

  const inventoryMix = [
    { label: 'Healthy', value: healthyPercent, color: '#2563eb' },
    { label: 'Watch', value: watchPercent, color: '#8b5cf6' },
    { label: 'Low', value: lowPercent, color: '#f59e0b' }
  ]

  const dynamicStats = [
    {
      title: "Total Products",
      value: String(summary?.totalProducts || 0),
      detail: `${summary?.totalCategories || 0} Categories / ${summary?.totalSuppliers || 0} Suppliers`,
      tone: "primary"
    },
    {
      title: "Today's Sales",
      value: formatPrice(summary?.todaySalesRevenue || 0),
      detail: `${summary?.todaySalesCount || 0} Sales today`,
      tone: "info"
    },
    {
      title: "Inventory Value",
      value: formatPrice(summary?.inventoryValue || 0),
      detail: "Valued at retail",
      tone: "success"
    },
    {
      title: "Low Stock",
      value: String(summary?.lowStockCount || 0),
      detail: "Below threshold",
      tone: "warning"
    },
    {
      title: "Expired Products",
      value: String(summary?.expiredCount || 0),
      detail: "Immediate attention",
      tone: "danger"
    },
    {
      title: "Total Revenue",
      value: formatPrice(summary?.totalRevenue || 0),
      detail: "Cumulative gross sales",
      tone: "primary"
    },
    {
      title: "Gross Profit",
      value: formatPrice(summary?.totalProfit || 0),
      detail: "Calculated profit margins",
      tone: "success"
    },
    {
      title: "Monthly Sales",
      value: formatPrice(summary?.monthlySalesRevenue || 0),
      detail: `${summary?.monthlySalesCount || 0} Sales last 30 days`,
      tone: "info"
    }
  ]

  const stockCards = products.slice(0, 5).map((p) => {
    let status = 'Healthy'
    if (p.quantity === 0) status = 'Low'
    else if (p.quantity < lowStockThreshold) status = 'Watch'
    return {
      name: p.name,
      count: `${p.quantity} units`,
      status
    }
  })

  return (
    <div className="page-stack dashboard-theme-bg">
      <PageHeader
        title="Dashboard"
        subtitle="A real-time overview of stock movement, sales, and operational health."
        action="Generate Report"
        onActionClick={generatePDFReport}
      />

      <section className="stats-grid">
        {dynamicStats.map((stat) => (
          <StatCard key={stat.title} title={stat.title} value={stat.value} detail={stat.detail} tone={stat.tone} />
        ))}
      </section>

      <section className="dashboard-widgets-grid">
        <Card title="Quick Actions" subtitle="Frequent tasks for the team" className="panel-card">
          <div className="quick-actions">
            {quickActions.map((item) => (
              <Button key={item} variant="ghost" className="action-pill" onClick={() => handleQuickAction(item)}>
                {item}
              </Button>
            ))}
          </div>
        </Card>

        <Card title="Recent Activities" subtitle="Latest operational updates" className="panel-card">
          <div className="activity-list">
            {(summary?.recentActivities || []).map((item) => (
              <div key={item.id} className="activity-item">
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
                <span>{item.time}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Recent Sales" subtitle="Latest invoices" className="panel-card">
          <Table
            columns={[
              { key: 'id', header: 'Order ID' },
              { key: 'customer', header: 'Customer' },
              { key: 'total', header: 'Total', render: (row) => formatPriceNoDecimals(row.total) },
              { key: 'status', header: 'Status', render: (row) => <Badge variant={row.status === 'Paid' ? 'success' : 'warning'}>{row.status}</Badge> }
            ]}
            rows={sales.slice(0, 5)}
          />
        </Card>

        <Card title="Stock Status" subtitle="Inventory posture by location" className="panel-card">
          <div className="stock-list">
            {stockCards.map((card) => (
              <div key={card.name} className="stock-item">
                <div>
                  <strong>{card.name}</strong>
                  <p>{card.count}</p>
                </div>
                <Badge variant={card.status === 'Healthy' ? 'success' : card.status === 'Watch' ? 'warning' : 'danger'}>{card.status}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Low Stock Alert" subtitle="Items needing attention" className="panel-card">
          <div className="alert-box">
            {products.filter(p => p.quantity < lowStockThreshold).length > 0 ? (
              <>
                <strong>⚠ {products.filter(p => p.quantity < lowStockThreshold).map(p => p.name).slice(0, 2).join(' and ')} require restocking</strong>
                <p>Predicted stock-out soon based on low levels and recent velocity.</p>
              </>
            ) : (
              <>
                <strong>✅ All stock levels are healthy</strong>
                <p>No inventory items are currently below the critical threshold.</p>
              </>
            )}
          </div>
        </Card>

        <Card title="Monthly Sales Chart" subtitle="Revenue and profit trend" className="panel-card chart-card">
          <MonthlySalesChart trendData={summary?.monthlySalesTrend} />
        </Card>

        <Card title="Weekly Sales" subtitle="Last 7 days revenue" className="panel-card chart-card">
          <WeeklySalesChart weeklyData={summary?.weeklySales} />
        </Card>

        <Card title="Inventory Trend" subtitle="Overall stock levels this week" className="panel-card chart-card">
          <InventoryTrendChart trendData={summary?.inventoryTrend} />
        </Card>

        <Card title="Category Distribution" subtitle="Stock levels by category" className="panel-card chart-card">
          <CategoryDistributionChart data={summary?.categoryDistribution} />
        </Card>

        <Card title="Inventory Mix" subtitle="Stock concentration" className="panel-card chart-card">
          <InventoryMixChart data={inventoryMix} />
        </Card>

        <AIInsights insights={aiAnalytics?.insights} />

        <NotificationsPanel />

        <TopSellingProducts products={summary?.topSellingProducts || []} />

        <DemandForecast forecastData={aiAnalytics?.demandForecast} recommendations={aiAnalytics?.recommendations} />
      </section>
    </div>
  )
}
