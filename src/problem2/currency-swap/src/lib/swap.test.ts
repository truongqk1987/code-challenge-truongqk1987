import { describe, expect, it } from 'vitest'
import { convert, getFee, getMinReceived, getPriceImpact, getRate } from './swap'
import { FEE_RATE, MOCK_LIQUIDITY_USD } from '../constants/config'
import type { Token } from '../types'

const token = (symbol: string, price: number): Token => ({
  symbol,
  price,
  iconUrl: '',
  updatedAt: '2023-08-29T07:10:40.000Z',
})

describe('convert', () => {
  it('converts using the price ratio', () => {
    // 100 USDC at $1 into ETH at $1,645 => 0.0608… ETH
    expect(convert(100, 1, 1645)).toBeCloseTo(100 / 1645, 12)
  })

  it('round-trips both ways without drift', () => {
    const priceIn = 1.0001
    const priceOut = 1645.93
    const out = convert(250, priceIn, priceOut)
    expect(convert(out, priceOut, priceIn)).toBeCloseTo(250, 9)

    const back = convert(3.42, priceOut, priceIn)
    expect(convert(back, priceIn, priceOut)).toBeCloseTo(3.42, 9)
  })

  it('returns 0 instead of dividing by zero', () => {
    expect(convert(100, 1, 0)).toBe(0)
    expect(convert(100, 0, 1)).toBe(0)
    expect(convert(100, 1, -5)).toBe(0)
    expect(convert(100, 1, Number.NaN)).toBe(0)
    expect(Number.isFinite(convert(100, 1, 0))).toBe(true)
  })

  it('handles very small numbers', () => {
    expect(convert(1e-9, 1, 2)).toBeCloseTo(5e-10, 20)
    expect(convert(1e-9, 2, 1)).toBeCloseTo(2e-9, 20)
    expect(convert(0, 1, 2)).toBe(0)
    expect(convert(-1, 1, 2)).toBe(0)
  })
})

describe('getRate', () => {
  it('reports how much "to" one "from" buys', () => {
    expect(getRate(token('USDC', 1), token('ETH', 1645))).toBeCloseTo(1 / 1645, 12)
  })

  it('is the reciprocal in the opposite direction', () => {
    const a = token('USDC', 1)
    const b = token('ETH', 1645)
    expect(getRate(a, b) * getRate(b, a)).toBeCloseTo(1, 12)
  })
})

describe('getFee', () => {
  it('takes FEE_RATE of the output amount', () => {
    expect(getFee(1000)).toBeCloseTo(1000 * FEE_RATE, 12)
    expect(getFee(0)).toBe(0)
    expect(getFee(-1)).toBe(0)
  })
})

describe('getMinReceived', () => {
  it('subtracts the fee and 0.5% slippage', () => {
    const out = 0.3654
    expect(getMinReceived(out, 0.5)).toBeCloseTo(out * (1 - FEE_RATE) * (1 - 0.005), 12)
  })

  it('only subtracts the fee at 0% slippage', () => {
    expect(getMinReceived(100, 0)).toBeCloseTo(100 * (1 - FEE_RATE), 12)
  })

  it('shrinks as slippage grows', () => {
    expect(getMinReceived(100, 1)).toBeLessThan(getMinReceived(100, 0.5))
    expect(getMinReceived(100, 0.5)).toBeLessThan(getMinReceived(100, 0.1))
  })

  it('returns 0 for a non-positive amount', () => {
    expect(getMinReceived(0, 0.5)).toBe(0)
    expect(getMinReceived(-4, 0.5)).toBe(0)
  })
})

describe('getPriceImpact', () => {
  it('grows with order size', () => {
    expect(getPriceImpact(1000)).toBeLessThan(getPriceImpact(100_000))
  })

  it('matches the liquidity formula', () => {
    const usd = 10_000
    expect(getPriceImpact(usd)).toBeCloseTo((usd / (usd + MOCK_LIQUIDITY_USD)) * 100, 12)
  })

  it('caps at 15% for enormous orders', () => {
    expect(getPriceImpact(1e15)).toBe(15)
    expect(getPriceImpact(Number.MAX_SAFE_INTEGER)).toBe(15)
    expect(getPriceImpact(MOCK_LIQUIDITY_USD * 100)).toBe(15)
  })

  it('is 0 for an empty order', () => {
    expect(getPriceImpact(0)).toBe(0)
    expect(getPriceImpact(-1)).toBe(0)
    expect(getPriceImpact(Number.NaN)).toBe(0)
  })
})
