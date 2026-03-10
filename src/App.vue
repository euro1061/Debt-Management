<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDebts } from '@/composables/useDebts'
import { usePayments } from '@/composables/usePayments'
import type { Debt, Payment } from '@/types'

import AppHeader from '@/components/AppHeader.vue'
import SummaryCards from '@/components/SummaryCards.vue'
import BottomNav from '@/components/BottomNav.vue'
import ToastNotification from '@/components/ToastNotification.vue'
import DebtList from '@/components/DebtList.vue'
import DebtModal from '@/components/DebtModal.vue'
import PaymentModal from '@/components/PaymentModal.vue'
import CountdownList from '@/components/CountdownList.vue'
import WhatIfCalculator from '@/components/WhatIfCalculator.vue'
import UpcomingPayments from '@/components/UpcomingPayments.vue'
import PaymentHistory from '@/components/PaymentHistory.vue'
import DailySummary from '@/components/DailySummary.vue'
import StrategyRecommendation from '@/components/StrategyRecommendation.vue'
import InterestAnalysis from '@/components/InterestAnalysis.vue'
import MonthlyChart from '@/components/MonthlyChart.vue'
import MonthlyGoal from '@/components/MonthlyGoal.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import DebtDetailModal from '@/components/DebtDetailModal.vue'
import SettingsPage from '@/components/SettingsPage.vue'
import { useSettings } from '@/composables/useSettings'
import { useStorage } from '@/composables/useStorage'

const { debts, fetchDebts, addDebt, updateDebt, deleteDebt, updateDebtRemaining, reorderDebts } = useDebts()
const { alertDays } = useSettings()
const { payments, fetchPayments, addPayment, updatePayment, deletePayment } = usePayments()
const { uploadReceipt } = useStorage()

const initialLoading = ref(true)

const activeTab = ref('dashboard')
const calendarSubTab = ref<'upcoming' | 'history'>('upcoming')

const debtModalVisible = ref(false)
const editingDebt = ref<Debt | null>(null)

const paymentModalVisible = ref(false)
const preselectedDebtId = ref<string | null>(null)
const editingPayment = ref<Payment | null>(null)

const confirmPaymentDeleteVisible = ref(false)
const pendingDeletePayment = ref<Payment | null>(null)

const detailModalVisible = ref(false)
const detailDebt = ref<Debt | null>(null)

const confirmVisible = ref(false)
const confirmDebtId = ref<string | null>(null)
const confirmDebtName = ref('')

const toastMessage = ref('')
const toastVisible = ref(false)
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(msg: string) {
  toastMessage.value = msg
  toastVisible.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastVisible.value = false }, 2500)
}

function openAddDebt() {
  editingDebt.value = null
  debtModalVisible.value = true
}

function openEditDebt(id: string) {
  editingDebt.value = debts.value.find(d => d.id === id) || null
  debtModalVisible.value = true
}

async function handleSaveDebt(data: {
  name: string; total_amount: number; remaining: number
  interest: number; min_payment: number
  frequency: 'monthly' | 'daily' | 'recurring_bill'; due_day: number; color: string; icon: string
}) {
  if (editingDebt.value) {
    await updateDebt(editingDebt.value.id, data)
    showToast('แก้ไขเรียบร้อย')
  } else {
    await addDebt(data)
    showToast('เพิ่มรายการหนี้แล้ว')
  }
  debtModalVisible.value = false
}

function handleDeleteDebt(id: string) {
  const debt = debts.value.find(d => d.id === id)
  confirmDebtId.value = id
  confirmDebtName.value = debt?.name ?? ''
  confirmVisible.value = true
}

async function confirmDeleteDebt() {
  if (!confirmDebtId.value) return
  await deleteDebt(confirmDebtId.value)
  confirmVisible.value = false
  confirmDebtId.value = null
  showToast('ลบรายการแล้ว')
}

function openDebtDetail(id: string) {
  detailDebt.value = debts.value.find(d => d.id === id) || null
  detailModalVisible.value = true
}

function openQuickPay(debtId: string) {
  editingPayment.value = null
  preselectedDebtId.value = debtId
  paymentModalVisible.value = true
}

function openPaymentModal() {
  editingPayment.value = null
  preselectedDebtId.value = null
  paymentModalVisible.value = true
}

function openEditPayment(payment: Payment) {
  editingPayment.value = payment
  preselectedDebtId.value = null
  paymentModalVisible.value = true
}

function requestDeletePayment(payment: Payment) {
  pendingDeletePayment.value = payment
  confirmPaymentDeleteVisible.value = true
}

async function confirmDeletePayment() {
  const p = pendingDeletePayment.value
  if (!p) return

  const debt = debts.value.find(d => d.id === p.debt_id)
  if (debt && debt.frequency !== 'recurring_bill') {
    const restoredRemaining = Math.min(
      Number(debt.total_amount),
      Number(debt.remaining) + Number(p.principal)
    )
    await updateDebtRemaining(debt.id, restoredRemaining)
  }

  await deletePayment(p.id)
  confirmPaymentDeleteVisible.value = false
  pendingDeletePayment.value = null
  showToast('ลบรายการชำระแล้ว')
}

async function handleSavePayment(data: {
  debtId: string; amount: number; date: string; note: string
  receiptFile: File | null; existingReceiptUrl: string
}) {
  const debt = debts.value.find(d => d.id === data.debtId)
  if (!debt) return

  let receipt_url = data.existingReceiptUrl || ''
  if (data.receiptFile) {
    const url = await uploadReceipt(data.receiptFile)
    if (url) receipt_url = url
  }

  const isBill = debt.frequency === 'recurring_bill'

  if (editingPayment.value) {
    if (isBill) {
      await updatePayment(editingPayment.value.id, {
        amount: data.amount,
        principal: data.amount,
        interest: 0,
        date: data.date,
        note: data.note,
        receipt_url
      })
    } else {
      const oldPrincipal = Number(editingPayment.value.principal)
      const baseRemaining = Number(debt.remaining) + oldPrincipal

      const monthlyRate = (Number(debt.interest) / 100) / 12
      const interestPortion = baseRemaining * monthlyRate
      const principalPortion = Math.max(0, data.amount - interestPortion)
      const newRemaining = Math.max(0, baseRemaining - principalPortion)

      await updatePayment(editingPayment.value.id, {
        amount: data.amount,
        principal: principalPortion,
        interest: interestPortion,
        date: data.date,
        note: data.note,
        receipt_url
      })

      await updateDebtRemaining(debt.id, newRemaining)
    }
    editingPayment.value = null
    paymentModalVisible.value = false
    showToast('แก้ไขการชำระเรียบร้อย')
  } else {
    if (isBill) {
      await addPayment({
        debt_id: data.debtId,
        debt_name: debt.name,
        amount: data.amount,
        principal: data.amount,
        interest: 0,
        date: data.date,
        note: data.note,
        color: debt.color,
        receipt_url
      })
      paymentModalVisible.value = false
      showToast('บันทึกค่าบิลเรียบร้อย')
    } else {
      const monthlyRate = (Number(debt.interest) / 100) / 12
      const interestPortion = Number(debt.remaining) * monthlyRate
      const principalPortion = Math.max(0, data.amount - interestPortion)
      const newRemaining = Math.max(0, Number(debt.remaining) - principalPortion)

      await addPayment({
        debt_id: data.debtId,
        debt_name: debt.name,
        amount: data.amount,
        principal: principalPortion,
        interest: interestPortion,
        date: data.date,
        note: data.note,
        color: debt.color,
        receipt_url
      })

      await updateDebtRemaining(debt.id, newRemaining)
      paymentModalVisible.value = false

      if (newRemaining <= 0) {
        showToast(`🎉 ยินดีด้วย! ปิดหนี้ "${debt.name}" แล้ว!`)
      } else {
        showToast('บันทึกการชำระสำเร็จ')
      }
    }
  }
}

function isPaidThisCycle(debtId: string, dueDay: number): boolean {
  const today = new Date()
  const cm = today.getMonth()
  const cy = today.getFullYear()

  let cycleStart: Date
  let cycleEnd: Date
  if (today.getDate() > dueDay) {
    cycleStart = new Date(cy, cm, dueDay)
    cycleEnd = new Date(cy, cm + 1, dueDay - 1)
  } else {
    cycleStart = new Date(cy, cm - 1, dueDay)
    cycleEnd = new Date(cy, cm, dueDay - 1)
  }
  cycleStart.setHours(0, 0, 0, 0)
  cycleEnd.setHours(23, 59, 59, 999)

  return payments.value.some(p => {
    if (p.debt_id !== debtId) return false
    const payDate = new Date(p.date)
    return payDate >= cycleStart && payDate <= cycleEnd
  })
}

function checkUpcomingAlerts() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const ALERT_KEY = 'df_last_alert_date'
  const todayStr = new Date().toISOString().split('T')[0]
  if (localStorage.getItem(ALERT_KEY) === todayStr) return
  localStorage.setItem(ALERT_KEY, todayStr)

  const today = new Date()
  const pending: { name: string; daysText: string; amount: string }[] = []

  debts.value.forEach(d => {
    if (d.frequency === 'daily') return
    const dueDay = parseInt(String(d.due_day)) || 1
    if (isPaidThisCycle(d.id, dueDay)) return

    let nextDue = new Date(today.getFullYear(), today.getMonth(), dueDay)
    if (nextDue < today) nextDue.setMonth(nextDue.getMonth() + 1)
    const diff = Math.ceil((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diff <= alertDays.value && diff >= 0) {
      pending.push({
        name: d.name,
        daysText: diff === 0 ? 'วันนี้' : `อีก ${diff} วัน`,
        amount: Number(d.min_payment) > 0 ? `฿${Number(d.min_payment).toLocaleString('th-TH')}` : ''
      })
    }
  })

  if (pending.length === 0) return

  if (pending.length === 1) {
    const p = pending[0]
    new Notification('Debt Free - แจ้งเตือนชำระ', {
      body: `${p.name}: ครบกำหนด${p.daysText}${p.amount ? ' (' + p.amount + ')' : ''}`,
      tag: 'df-upcoming'
    })
  } else {
    const names = pending.map(p => p.name).join(', ')
    new Notification(`Debt Free - มี ${pending.length} รายการใกล้ครบกำหนด`, {
      body: names,
      tag: 'df-upcoming'
    })
  }
}

onMounted(async () => {
  await Promise.all([fetchDebts(), fetchPayments()])
  initialLoading.value = false

  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
  checkUpcomingAlerts()
})
</script>

<template>
  <!-- Loading Screen -->
  <Transition name="loading-fade">
    <div v-if="initialLoading" class="loading-screen">
      <div class="loading-content">
        <div class="loading-rings">
          <div class="loading-ring ring-1"></div>
          <div class="loading-ring ring-2"></div>
          <div class="loading-ring ring-3"></div>
          <div class="loading-icon">
            <i class="fas fa-piggy-bank"></i>
          </div>
        </div>
        <h2 class="loading-title">Debt Free</h2>
        <p class="loading-subtitle">กำลังโหลดข้อมูล...</p>
        <div class="loading-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  </Transition>

  <template v-if="!initialLoading">
    <AppHeader />

    <SummaryCards :debts="debts" />

    <main class="tab-content">
    <!-- Tab 1: Dashboard -->
    <section v-show="activeTab === 'dashboard'" class="tab-pane active">
      <DebtList
        :debts="debts"
        :payments="payments"
        @add="openAddDebt"
        @edit="openEditDebt"
        @delete="handleDeleteDebt"
        @pay="openQuickPay"
        @detail="openDebtDetail"
        @reorder="reorderDebts"
      />
    </section>

    <!-- Tab 2: Calculator -->
    <section v-show="activeTab === 'calculator'" class="tab-pane active">
      <div class="section-header">
        <h2><i class="fas fa-calculator"></i> คำนวณระยะเวลา</h2>
      </div>
      <CountdownList :debts="debts" />
      <WhatIfCalculator :debts="debts" />
    </section>

    <!-- Tab 3: Calendar -->
    <section v-show="activeTab === 'calendar'" class="tab-pane active">
      <div class="section-header">
        <h2><i class="fas fa-calendar-days"></i> ปฏิทินการจ่าย</h2>
        <button class="btn-primary btn-sm" @click="openPaymentModal">
          <i class="fas fa-plus"></i> บันทึกชำระ
        </button>
      </div>

      <div class="sub-tabs">
        <button
          class="sub-tab"
          :class="{ active: calendarSubTab === 'upcoming' }"
          @click="calendarSubTab = 'upcoming'"
        >
          <i class="fas fa-bell"></i> กำหนดจ่าย
        </button>
        <button
          class="sub-tab"
          :class="{ active: calendarSubTab === 'history' }"
          @click="calendarSubTab = 'history'"
        >
          <i class="fas fa-clock-rotate-left"></i> ประวัติชำระ
        </button>
      </div>

      <UpcomingPayments v-show="calendarSubTab === 'upcoming'" :debts="debts" :payments="payments" @pay="openQuickPay" />

      <PaymentHistory
        v-show="calendarSubTab === 'history'"
        :payments="payments"
        @open-payment-modal="openPaymentModal"
        @edit-payment="openEditPayment"
        @delete-payment="requestDeletePayment"
      />
    </section>

    <!-- Tab 4: Insights -->
    <section v-show="activeTab === 'insights'" class="tab-pane active">
      <div class="section-header">
        <h2><i class="fas fa-lightbulb"></i> วิเคราะห์และแนะนำ</h2>
      </div>
      <MonthlyGoal :payments="payments" />
      <MonthlyChart :payments="payments" />
      <DailySummary :debts="debts" />
      <StrategyRecommendation :debts="debts" />
      <InterestAnalysis :debts="debts" :payments="payments" />
    </section>

    <!-- Tab 5: Settings -->
    <section v-show="activeTab === 'settings'" class="tab-pane active">
      <SettingsPage />
    </section>
  </main>

  <BottomNav :active-tab="activeTab" @switch="activeTab = $event" />

  <DebtModal
    :visible="debtModalVisible"
    :edit-debt="editingDebt"
    @close="debtModalVisible = false"
    @save="handleSaveDebt"
  />

  <PaymentModal
    :visible="paymentModalVisible"
    :debts="debts"
    :preselected-debt-id="preselectedDebtId"
    :edit-payment="editingPayment"
    @close="paymentModalVisible = false; editingPayment = null"
    @save="handleSavePayment"
  />

  <ConfirmModal
    :visible="confirmVisible"
    title="ลบรายการหนี้"
    message="คุณต้องการลบรายการหนี้นี้ใช่หรือไม่?"
    :detail="confirmDebtName"
    confirm-text="ลบรายการ"
    cancel-text="ยกเลิก"
    @confirm="confirmDeleteDebt"
    @cancel="confirmVisible = false"
  />

  <ConfirmModal
    :visible="confirmPaymentDeleteVisible"
    title="ลบรายการชำระ"
    message="ลบรายการชำระนี้และคืนยอดเงินต้นกลับไปที่หนี้?"
    :detail="pendingDeletePayment ? `${pendingDeletePayment.debt_name} - ฿${Number(pendingDeletePayment.amount).toLocaleString('th-TH')}` : ''"
    confirm-text="ลบรายการ"
    cancel-text="ยกเลิก"
    @confirm="confirmDeletePayment"
    @cancel="confirmPaymentDeleteVisible = false"
  />

  <DebtDetailModal
    :visible="detailModalVisible"
    :debt="detailDebt"
    :payments="payments"
    @close="detailModalVisible = false"
  />

  <ToastNotification :message="toastMessage" :visible="toastVisible" />
  </template>
</template>
