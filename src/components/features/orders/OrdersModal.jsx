import { useState, useEffect } from 'react'
import { useFarm } from '../../../contexts/FarmContext'
import {
  getOrders,
  updateOrder,
  markOrderProcessing,
  markOrderCompleted,
} from '../../../services/order.service'

const STATUS_LABELS = {
  pending: 'ממתין',
  processing: 'בטיפול',
  completed: 'הושלם',
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
}

function formatTimeAgo(date) {
  if (!date) return ''
  const mins = Math.floor((Date.now() - date.getTime()) / 60000)
  if (mins < 1) return 'עכשיו'
  if (mins < 60) return `לפני ${mins} דק'`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `לפני ${hrs} שע'`
  return `לפני ${Math.floor(hrs / 24)} ימים`
}

// ─── PackingItemRow ───────────────────────────────────────────────────────────

function PackingItemRow({ item, onPackedChange, onIsPackedChange, onMarkAquariumEmptyChange }) {
  return (
    <div
      className={`grid gap-2 p-3 rounded-xl text-sm items-center ${
        item.isPacked ? 'bg-green-50' : 'bg-gray-50'
      }`}
      style={{ gridTemplateColumns: '2rem 1fr 4.5rem 4.5rem 5rem' }}
    >
      {/* isPacked checkbox */}
      <input
        type="checkbox"
        checked={item.isPacked}
        onChange={e => onIsPackedChange(e.target.checked)}
        className="w-5 h-5 accent-green-500 cursor-pointer"
      />

      {/* Fish name */}
      <div className={item.isPacked ? 'line-through text-gray-400' : 'text-gray-900'}>
        <div className="font-medium truncate">{item.hebrewName || item.scientificName}</div>
        <div className="text-xs text-gray-400 truncate">{item.size}</div>
      </div>

      {/* Requested qty */}
      <div className="text-center">
        <div className="text-xs text-gray-400 mb-0.5">הוזמן</div>
        <div className="font-semibold text-gray-700">{item.requestedQuantity}</div>
      </div>

      {/* Packed qty (editable) */}
      <div className="text-center">
        <div className="text-xs text-gray-400 mb-0.5">נארז</div>
        <input
          type="number"
          min="0"
          value={item.packedQuantity}
          onChange={e => onPackedChange(parseInt(e.target.value, 10) || 0)}
          className="w-16 px-1 py-1 border border-gray-300 rounded text-center font-bold focus:border-blue-500 focus:outline-none bg-white text-sm"
        />
      </div>

      {/* Aquarium empty */}
      <div className="text-center">
        {item.aquariumNumber ? (
          <label className="flex flex-col items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={item.markAquariumEmpty}
              onChange={e => onMarkAquariumEmptyChange(e.target.checked)}
              className="w-4 h-4 accent-orange-500"
            />
            <span className="text-xs text-gray-500 leading-tight">
              #{item.aquariumNumber}
              <br />ריק
            </span>
          </label>
        ) : null}
      </div>
    </div>
  )
}

// ─── OrderCard ────────────────────────────────────────────────────────────────

function OrderCard({ order, isExpanded, isSaving, onExpand, onItemUpdate, onComplete }) {
  const totalRequested = order.items.reduce((sum, i) => sum + (i.requestedQuantity || 0), 0)
  const packedCount = order.items.filter(i => i.isPacked).length

  return (
    <div
      className={`border-2 rounded-xl overflow-hidden transition-all ${
        isExpanded ? 'border-blue-400' : 'border-gray-200'
      }`}
    >
      {/* Summary row */}
      <button
        onClick={onExpand}
        className="w-full text-right px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[order.status]}`}
          >
            {STATUS_LABELS[order.status]}
          </span>
          <span className="font-semibold text-gray-900">{order.customerName}</span>
          {order.customerPhone && (
            <span className="text-sm text-gray-500">{order.customerPhone}</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500 shrink-0">
          <span>
            {order.items.length} סוגים | {totalRequested} יח'
          </span>
          <span className="text-xs">{formatTimeAgo(order.createdAt)}</span>
          <span>{isExpanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Expanded checklist */}
      {isExpanded && (
        <div className="border-t border-gray-200 px-4 pt-3 pb-4">
          {order.notes && (
            <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              הערה: {order.notes}
            </div>
          )}

          {/* Column headers */}
          <div
            className="grid gap-2 px-3 mb-1 text-xs text-gray-400 font-medium"
            style={{ gridTemplateColumns: '2rem 1fr 4.5rem 4.5rem 5rem' }}
          >
            <div></div>
            <div>דג</div>
            <div className="text-center">הוזמן</div>
            <div className="text-center">נארז</div>
            <div className="text-center">אקווריום</div>
          </div>

          <div className="space-y-1.5">
            {order.items.map((item, idx) => (
              <PackingItemRow
                key={idx}
                item={item}
                onPackedChange={val => onItemUpdate(idx, 'packedQuantity', val)}
                onIsPackedChange={val => onItemUpdate(idx, 'isPacked', val)}
                onMarkAquariumEmptyChange={val => onItemUpdate(idx, 'markAquariumEmpty', val)}
              />
            ))}
          </div>

          {/* Progress indicator */}
          {order.status !== 'completed' && (
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-green-500 h-full rounded-full transition-all"
                  style={{ width: `${(packedCount / order.items.length) * 100}%` }}
                />
              </div>
              <span>{packedCount}/{order.items.length} ארוזו</span>
            </div>
          )}

          {/* Complete button */}
          {order.status !== 'completed' && (
            <button
              onClick={onComplete}
              disabled={isSaving}
              className="mt-3 w-full py-2.5 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 disabled:opacity-50 transition-colors text-sm"
            >
              {isSaving ? 'שומר...' : '✅ סמן הזמנה כהושלמה'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── OrdersModal ──────────────────────────────────────────────────────────────

function OrdersModal({ isOpen, onClose }) {
  const { currentFarm } = useFarm()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [expandedOrderId, setExpandedOrderId] = useState(null)
  const [savingOrderId, setSavingOrderId] = useState(null)

  useEffect(() => {
    if (isOpen && currentFarm?.farmId) {
      loadOrders()
    }
  }, [isOpen, currentFarm?.farmId])

  async function loadOrders() {
    setLoading(true)
    try {
      const data = await getOrders(currentFarm.farmId)
      setOrders(data)
    } catch (err) {
      console.error('Error loading orders:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleExpandOrder(order) {
    const newExpanded = expandedOrderId === order.orderId ? null : order.orderId
    setExpandedOrderId(newExpanded)

    // Auto-transition pending → processing when owner opens it
    if (newExpanded && order.status === 'pending') {
      await markOrderProcessing(order.orderId)
      setOrders(prev =>
        prev.map(o => (o.orderId === order.orderId ? { ...o, status: 'processing' } : o))
      )
    }
  }

  async function handleItemUpdate(orderId, itemIndex, field, value) {
    // Optimistic local update
    setOrders(prev =>
      prev.map(o => {
        if (o.orderId !== orderId) return o
        const updatedItems = o.items.map((item, idx) =>
          idx === itemIndex ? { ...item, [field]: value } : item
        )
        return { ...o, items: updatedItems }
      })
    )

    // Persist to Firestore
    const order = orders.find(o => o.orderId === orderId)
    if (!order) return
    const updatedItems = order.items.map((item, idx) =>
      idx === itemIndex ? { ...item, [field]: value } : item
    )
    await updateOrder(orderId, { items: updatedItems })
  }

  async function handleCompleteOrder(orderId) {
    if (!confirm('לסמן הזמנה זו כהושלמה?')) return
    setSavingOrderId(orderId)
    try {
      const order = orders.find(o => o.orderId === orderId)
      await markOrderCompleted(orderId, currentFarm.farmId, order?.items || [])
      setOrders(prev =>
        prev.map(o => (o.orderId === orderId ? { ...o, status: 'completed' } : o))
      )
      setExpandedOrderId(null)
    } catch (err) {
      console.error('Error completing order:', err)
    } finally {
      setSavingOrderId(null)
    }
  }

  if (!isOpen) return null

  const TABS = [
    { key: 'pending', label: 'ממתינות' },
    { key: 'processing', label: 'בטיפול' },
    { key: 'completed', label: 'הושלמו' },
    { key: 'all', label: 'הכל' },
  ]

  const filteredOrders =
    statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter)

  const pendingCount = orders.filter(o => o.status === 'pending').length

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001] p-0 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full sm:max-w-3xl h-full sm:h-auto max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="m-0 text-[22px] font-semibold text-gray-900">הזמנות</h2>
            {pendingCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingCount} חדשות
              </span>
            )}
          </div>
          <button
            className="bg-transparent border-none text-[28px] leading-none text-gray-400 cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 hover:text-gray-700"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-gray-100 px-6 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                statusFilter === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.key !== 'all' && (
                <span className="ml-1 text-xs text-gray-400">
                  ({orders.filter(o => o.status === tab.key).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Order List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-14 text-gray-400">
              <div className="text-4xl mb-2">📭</div>
              <div>
                {statusFilter === 'pending' ? 'אין הזמנות חדשות' : 'אין הזמנות'}
              </div>
            </div>
          ) : (
            filteredOrders.map(order => (
              <OrderCard
                key={order.orderId}
                order={order}
                isExpanded={expandedOrderId === order.orderId}
                isSaving={savingOrderId === order.orderId}
                onExpand={() => handleExpandOrder(order)}
                onItemUpdate={(itemIndex, field, value) =>
                  handleItemUpdate(order.orderId, itemIndex, field, value)
                }
                onComplete={() => handleCompleteOrder(order.orderId)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <span className="text-xs text-gray-400">{orders.length} הזמנות סה"כ</span>
          <button
            onClick={loadOrders}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            🔄 רענן
          </button>
        </div>
      </div>
    </div>
  )
}

export default OrdersModal
