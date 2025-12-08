import apiClient, { handleApiError } from './api'

// ============================================
// TYPES & INTERFACES
// ============================================

export interface TimeSlot {
  time_slot_id?: string
  id?: string
  doctor_id: string
  branch_id: string
  available_date: string
  start_time: string
  end_time: string
  is_booked?: boolean
  doctor_name?: string
  branch_name?: string
  doctor_email?: string
  medical_licence_no?: string
  consultation_fee?: number
  [key: string]: unknown
}

export interface TimeSlotCreateRequest {
  doctor_id: string
  branch_id: string
  available_date: string
  start_time: string
  end_time: string
}

export interface SingleTimeSlot {
  available_date: string
  start_time: string
  end_time: string
}

export interface BulkTimeSlotsRequest {
  doctor_id: string
  branch_id: string
  time_slots: SingleTimeSlot[]
}

export interface BulkCreationResponse {
  success: boolean
  message: string
  summary?: {
    total_requested: number
    total_created: number
    total_failed: number
  }
  created_slots?: TimeSlot[]
  failed_slots?: Array<{
    available_date: string
    start_time: string
    end_time: string
    error: string
  }>
}

export interface TimeSlotListResponse {
  total: number
  returned: number
  time_slots: TimeSlot[]
}

export interface DoctorTimeSlotsResponse {
  doctor_id: string
  total: number
  time_slots: TimeSlot[]
}

export interface BranchTimeSlotsResponse {
  branch_id: string
  branch_name: string
  total: number
  time_slots: TimeSlot[]
}

export interface AvailableTimeSlotsResponse {
  doctor_id: string
  total_available: number
  time_slots: TimeSlot[]
}

export interface TimeSlotDetailsResponse {
  time_slot: TimeSlot
}

export interface DeleteResponse {
  success: boolean
  message: string
}

export interface TimeSlotFilter {
  doctor_id?: string
  branch_id?: string
  date_from?: string
  date_to?: string
  is_booked?: boolean
  include_past?: boolean
}

export interface SlotSchedule {
  date: string
  doctor_name: string
  branch_name: string
  slots: TimeSlot[]
  total_slots: number
  available_slots: number
  booked_slots: number
}

// ============================================
// TIME SLOT SERVICE
// ============================================

class TimeSlotService {
  // ============================================
  // CREATE METHODS
  // ============================================

  /**
   * Create single time slot
   * POST /timeslots
   */
  async createTimeSlot(slotData: TimeSlotCreateRequest): Promise<TimeSlot> {
    try {
      const response = await apiClient.post<{ time_slot: TimeSlot }>(
        '/timeslots',
        slotData
      )
      console.log('✅ Time slot created')
      return response.data.time_slot
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to create time slot'))
    }
  }

  /**
   * Create bulk time slots
   * POST /timeslots/create-bulk
   */
  async createBulkTimeSlots(bulkData: BulkTimeSlotsRequest): Promise<BulkCreationResponse> {
    try {
      const response = await apiClient.post<BulkCreationResponse>(
        '/timeslots/create-bulk',
        bulkData
      )
      console.log('✅ Bulk time slots created')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to create bulk time slots'))
    }
  }

  /**
   * Create multiple time slots at regular intervals
   */
  async createMultipleTimeSlots(
    doctorId: string,
    branchId: string,
    availableDate: string,
    startTime: string,
    endTime: string,
    slotDuration: number
  ): Promise<BulkCreationResponse> {
    try {
      const slots = this.generateTimeSlots(startTime, endTime, slotDuration)
      const bulkData: BulkTimeSlotsRequest = {
        doctor_id: doctorId,
        branch_id: branchId,
        time_slots: slots.map((slot) => ({
          available_date: availableDate,
          start_time: slot.start,
          end_time: slot.end,
        })),
      }
      return await this.createBulkTimeSlots(bulkData)
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to create multiple time slots'))
    }
  }

  // ============================================
  // GET METHODS
  // ============================================

  /**
   * Get all time slots with filters
   * GET /timeslots/?skip=0&limit=100&is_booked=false&date_filter=2025-10-20
   */
  async getAllTimeSlots(
    skip: number = 0,
    limit: number = 100,
    isBooked?: boolean,
    dateFilter?: string
  ): Promise<TimeSlotListResponse> {
    try {
      const params = new URLSearchParams()
      params.append('skip', skip.toString())
      params.append('limit', limit.toString())
      if (isBooked !== undefined) params.append('is_booked', isBooked.toString())
      if (dateFilter) params.append('date_filter', dateFilter)

      const response = await apiClient.get<TimeSlotListResponse>(
        `/timeslots/?${params.toString()}`
      )
      console.log('✅ Fetched all time slots')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch time slots'))
    }
  }

  /**
   * Get time slot by ID
   * GET /timeslots/{time_slot_id}
   */
  async getTimeSlotById(timeSlotId: string): Promise<TimeSlot> {
    try {
      const response = await apiClient.get<TimeSlotDetailsResponse>(
        `/timeslots/${timeSlotId}`
      )
      console.log('✅ Fetched time slot details')
      return response.data.time_slot
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch time slot'))
    }
  }

  /**
   * Get all time slots for a doctor
   * GET /timeslots/doctor/{doctor_id}?include_past=false&is_booked=false
   */
  async getTimeSlotsByDoctor(
    doctorId: string,
    includePast: boolean = false,
    isBooked?: boolean
  ): Promise<DoctorTimeSlotsResponse> {
    try {
      const params = new URLSearchParams()
      params.append('include_past', includePast.toString())
      if (isBooked !== undefined) params.append('is_booked', isBooked.toString())

      const response = await apiClient.get<DoctorTimeSlotsResponse>(
        `/timeslots/doctor/${doctorId}?${params.toString()}`
      )
      console.log('✅ Fetched doctor time slots')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch doctor time slots'))
    }
  }

  /**
   * Get all time slots for a branch
   * GET /timeslots/branch/{branch_id}?include_past=false&is_booked=false
   */
  async getTimeSlotsByBranch(
    branchId: string,
    includePast: boolean = false,
    isBooked?: boolean
  ): Promise<BranchTimeSlotsResponse> {
    try {
      const params = new URLSearchParams()
      params.append('include_past', includePast.toString())
      if (isBooked !== undefined) params.append('is_booked', isBooked.toString())

      const response = await apiClient.get<BranchTimeSlotsResponse>(
        `/timeslots/branch/${branchId}?${params.toString()}`
      )
      console.log('✅ Fetched branch time slots')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch branch time slots'))
    }
  }

  /**
   * Get available time slots for a doctor
   * GET /timeslots/available/doctor/{doctor_id}?date_from=2025-10-20&date_to=2025-10-27
   */
  async getAvailableSlotsByDoctor(
    doctorId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<AvailableTimeSlotsResponse> {
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)

      const response = await apiClient.get<AvailableTimeSlotsResponse>(
        `/timeslots/available/doctor/${doctorId}?${params.toString()}`
      )
      console.log('✅ Fetched available time slots')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch available slots'))
    }
  }

  // ============================================
  // DELETE METHODS
  // ============================================

  /**
   * Delete time slot
   * DELETE /timeslots/{time_slot_id}
   */
  async deleteTimeSlot(timeSlotId: string): Promise<DeleteResponse> {
    try {
      const response = await apiClient.delete<DeleteResponse>(
        `/timeslots/${timeSlotId}`
      )
      console.log('✅ Time slot deleted')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to delete time slot'))
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Generate time slots at regular intervals
   */
  generateTimeSlots(
    startTime: string,
    endTime: string,
    durationMinutes: number
  ): Array<{ start: string; end: string }> {
    const slots: Array<{ start: string; end: string }> = []

    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)

    let currentMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin

    while (currentMinutes + durationMinutes <= endMinutes) {
      const slotStartHour = Math.floor(currentMinutes / 60)
      const slotStartMin = currentMinutes % 60
      const slotEndMinutes = currentMinutes + durationMinutes
      const slotEndHour = Math.floor(slotEndMinutes / 60)
      const slotEndMin = slotEndMinutes % 60

      const start = `${String(slotStartHour).padStart(2, '0')}:${String(slotStartMin).padStart(2, '0')}:00`
      const end = `${String(slotEndHour).padStart(2, '0')}:${String(slotEndMin).padStart(2, '0')}:00`

      slots.push({ start, end })
      currentMinutes += durationMinutes
    }

    return slots
  }

  /**
   * Get slot duration in minutes
   */
  getSlotDuration(startTime: string, endTime: string): number {
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)

    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin

    return endMinutes - startMinutes
  }

  /**
   * Check if slot is available
   */
  isSlotAvailable(slot: TimeSlot): boolean {
    return !slot.is_booked && this.isSlotInFuture(slot)
  }

  /**
   * Check if slot is in future
   */
  isSlotInFuture(slot: TimeSlot): boolean {
    const slotDate = new Date(slot.available_date)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return slotDate >= now
  }

  /**
   * Format time slot (10:00 AM - 10:30 AM)
   */
  formatSlotTime(slot: TimeSlot): string {
    const formatTime = (time: string): string => {
      const [hour, minute] = time.split(':').slice(0, 2)
      const h = parseInt(hour)
      const m = minute
      const period = h >= 12 ? 'PM' : 'AM'
      const displayHour = h % 12 || 12
      return `${displayHour}:${m} ${period}`
    }

    return `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`
  }

  /**
   * Get slot status
   */
  getSlotStatus(slot: TimeSlot): { status: string; icon: string; color: string } {
    if (!this.isSlotInFuture(slot)) {
      return { status: 'Past', icon: '⏳', color: 'gray' }
    }
    if (slot.is_booked) {
      return { status: 'Booked', icon: '❌', color: 'red' }
    }
    return { status: 'Available', icon: '✅', color: 'green' }
  }

  /**
   * Filter slots
   */
  filterSlots(slots: TimeSlot[], filter: TimeSlotFilter): TimeSlot[] {
    return slots.filter((slot) => {
      if (filter.doctor_id && slot.doctor_id !== filter.doctor_id) return false
      if (filter.branch_id && slot.branch_id !== filter.branch_id) return false
      if (filter.is_booked !== undefined && slot.is_booked !== filter.is_booked)
        return false

      const slotDate = new Date(slot.available_date)
      if (filter.date_from) {
        const fromDate = new Date(filter.date_from)
        if (slotDate < fromDate) return false
      }
      if (filter.date_to) {
        const toDate = new Date(filter.date_to)
        if (slotDate > toDate) return false
      }

      if (!filter.include_past && !this.isSlotInFuture(slot)) return false

      return true
    })
  }

  /**
   * Sort slots
   */
  sortSlots(slots: TimeSlot[], order: 'asc' | 'desc' = 'asc'): TimeSlot[] {
    return [...slots].sort((a, b) => {
      const dateA = new Date(`${a.available_date}T${a.start_time}`).getTime()
      const dateB = new Date(`${b.available_date}T${b.start_time}`).getTime()
      return order === 'asc' ? dateA - dateB : dateB - dateA
    })
  }

  /**
   * Count available slots
   */
  getAvailableSlotsCount(slots: TimeSlot[]): number {
    return slots.filter((slot) => this.isSlotAvailable(slot)).length
  }

  /**
   * Count booked slots
   */
  getBookedSlotsCount(slots: TimeSlot[]): number {
    return slots.filter((slot) => slot.is_booked).length
  }

  /**
   * Get utilization percentage
   */
  getUtilizationPercentage(slots: TimeSlot[]): number {
    if (slots.length === 0) return 0
    const bookedCount = this.getBookedSlotsCount(slots)
    return Math.round((bookedCount / slots.length) * 100)
  }

  /**
   * Create schedule view
   */
  createScheduleView(slots: TimeSlot[]): SlotSchedule[] {
    const schedules: SlotSchedule[] = []
    const grouped = this.groupSlotsByDate(slots)

    Object.entries(grouped).forEach(([date, dateSlots]) => {
      const available = dateSlots.filter((s) => this.isSlotAvailable(s)).length
      const booked = dateSlots.filter((s) => s.is_booked).length

      schedules.push({
        date,
        doctor_name: dateSlots[0]?.doctor_name || 'Unknown',
        branch_name: dateSlots[0]?.branch_name || 'Unknown',
        slots: dateSlots,
        total_slots: dateSlots.length,
        available_slots: available,
        booked_slots: booked,
      })
    })

    return schedules.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  /**
   * Group slots by date
   */
  groupSlotsByDate(slots: TimeSlot[]): Record<string, TimeSlot[]> {
    const grouped: Record<string, TimeSlot[]> = {}

    slots.forEach((slot) => {
      if (!grouped[slot.available_date]) {
        grouped[slot.available_date] = []
      }
      grouped[slot.available_date].push(slot)
    })

    return grouped
  }

  /**
   * Group slots by doctor
   */
  groupSlotsByDoctor(slots: TimeSlot[]): Record<string, TimeSlot[]> {
    const grouped: Record<string, TimeSlot[]> = {}

    slots.forEach((slot) => {
      const doctorName = slot.doctor_name || slot.doctor_id
      if (!grouped[doctorName]) {
        grouped[doctorName] = []
      }
      grouped[doctorName].push(slot)
    })

    return grouped
  }

  /**
   * Generate summary report
   */
  generateSummaryReport(slots: TimeSlot[]): {
    total_slots: number
    available: number
    booked: number
    utilization: number
    by_doctor: Record<string, { total: number; available: number; booked: number }>
    by_branch: Record<string, { total: number; available: number; booked: number }>
  } {
    const byDoctor: Record<string, { total: number; available: number; booked: number }> = {}
    const byBranch: Record<string, { total: number; available: number; booked: number }> = {}

    slots.forEach((slot) => {
      const doctor = slot.doctor_name || 'Unknown'
      const branch = slot.branch_name || 'Unknown'

      if (!byDoctor[doctor]) {
        byDoctor[doctor] = { total: 0, available: 0, booked: 0 }
      }
      if (!byBranch[branch]) {
        byBranch[branch] = { total: 0, available: 0, booked: 0 }
      }

      byDoctor[doctor].total++
      byBranch[branch].total++

      if (slot.is_booked) {
        byDoctor[doctor].booked++
        byBranch[branch].booked++
      } else {
        byDoctor[doctor].available++
        byBranch[branch].available++
      }
    })

    return {
      total_slots: slots.length,
      available: this.getAvailableSlotsCount(slots),
      booked: this.getBookedSlotsCount(slots),
      utilization: this.getUtilizationPercentage(slots),
      by_doctor: byDoctor,
      by_branch: byBranch,
    }
  }

  /**
   * Export slots as CSV
   */
  exportAsCSV(slots: TimeSlot[], filename: string = 'timeslots.csv'): void {
    const headers = [
      'Date',
      'Start Time',
      'End Time',
      'Doctor',
      'Branch',
      'Status',
      'Duration (mins)',
    ]

    const rows = slots.map((slot) => {
      const status = this.getSlotStatus(slot).status
      const duration = this.getSlotDuration(slot.start_time, slot.end_time)
      return [
        slot.available_date,
        slot.start_time,
        slot.end_time,
        slot.doctor_name || '',
        slot.branch_name || '',
        status,
        duration.toString(),
      ]
    })

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
}

export default new TimeSlotService()