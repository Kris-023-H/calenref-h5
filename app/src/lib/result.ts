/**
 * lib/result.ts — Result<T> 与错误码约定。
 * 引擎与服务层不抛异常：失败以 Err 值回流，UI 层统一消费（架构 §2.2）。
 */

export type ErrCode =
  | 'unknown'
  | 'network'
  | 'storage'
  | 'notFound'
  | 'quota'
  | 'invalidInput'
  | 'payFail'
  | 'redeemFail';

export interface Ok<T> {
  ok: true;
  value: T;
}

export interface Err {
  ok: false;
  code: ErrCode;
  /** i18n MsgKey（err.* 命名空间）或空串（调用方自备文案） */
  msgKey?: string;
  detail?: string;
  /**
   * 联合可访问性占位：Err 运行时无 value（恒 undefined）。
   * 使 Result<T> 上可直接 .value（类型 T | undefined）而不必先窄化；
   * 语义不变——读取方仍应先判 ok，Err 的 value 恒为 undefined。
   */
  value?: undefined;
}

export type Result<T> = Ok<T> | Err;

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export function err<T = never>(code: ErrCode, msgKey?: string, detail?: string): Result<T> {
  return { ok: false, code, msgKey, detail };
}

/** 结果映射：把 Ok 的值变换，Err 原样透传 */
export function mapResult<T, U>(r: Result<T>, fn: (v: T) => U): Result<U> {
  return r.ok ? ok(fn(r.value)) : r;
}

/** 取 Ok 值或默认值 */
export function unwrapOr<T>(r: Result<T>, fallback: T): T {
  return r.ok ? r.value : fallback;
}

/** 兜底包裹：把同步异常收敛为 Err（仅用于 repo/service 边界） */
export async function tryResult<T>(fn: () => Promise<T> | T): Promise<Result<T>> {
  try {
    return ok(await fn());
  } catch (e) {
    return err('unknown', 'err.unknown', e instanceof Error ? e.message : String(e));
  }
}
