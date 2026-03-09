export function fmt(n: number | string | undefined): string {
  return '฿' + Number(n || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
}

export function fmtNum(n: number | string | undefined): string {
  return Number(n || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
}
