// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (token/ERC20/ERC20.sol)

import {JSON} from "@klave/sdk"
import {address, revert, emit} from "../../klave/types"
import {Account} from "../../klave/ERC20/ERC20Structs"
import {Context} from "@klave/sdk"
import {IERC20, IERC20Events} from "./IERC20"
import {IERC20Metadata} from "./extensions/IERC20Metadata";

/**
 * @dev Implementation of the {IERC20} interface.
 *
 * This implementation is agnostic to the way tokens are created. This means
 * that a supply mechanism has to be added in a derived contract using {_mint}.
 *
 * TIP: For a detailed writeup see our guide
 * https://forum.openzeppelin.com/t/how-to-implement-erc20-supply-mechanisms/226[How
 * to implement supply mechanisms].
 *
 * The default value of {decimals} is 18. To change this, you should override
 * this function so it returns a different value.
 *
 * We have followed general OpenZeppelin Contracts guidelines: functions revert
 * instead returning `false` on failure. This behavior is nonetheless
 * conventional and does not conflict with the expectations of ERC20
 * applications.
 *
 * Additionally, an {Approval} event is emitted on calls to {transferFrom}.
 * This allows applications to reconstruct the allowance for all accounts just
 * by listening to said events. Other implementations of the EIP may not emit
 * these events, as it isn't required by the specification.
 */
@serializable
export class ERC20 extends IERC20Events implements IERC20, IERC20Metadata {
    _accounts: Array<Account>;    

    _decimals: u8;
    _totalSupply: u64;
    _name: string;
    _symbol: string;

    /**
     * @dev Sets the values for {name} and {symbol}.
     *
     * All two of these values are immutable: they can only be set once during
     * construction.
     */
    constructor(name_: string, symbol_: string, decimals_: u8, totalSupply_: u64) {
        super();
        this._name = name_;
        this._symbol = symbol_;
        this._decimals = decimals_;
        this._totalSupply = totalSupply_;
        this._accounts = new Array<Account>();        
    }

    /**
     * @dev Returns the name of the token.
     */
    name() : string {
        return this._name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    symbol() : string {
        return this._symbol;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5.05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This is the default value returned by this function, unless
     * it's overridden.
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    decimals() : u8 {
        return this._decimals;
    }

    /**
     * @dev See {IERC20-totalSupply}.
     */
    totalSupply() : u64 {
        return this._totalSupply;
    }

    /**
     * @dev See {IERC20-balanceOf}.
     */
    balanceOf(account: address) : u64 {
        return this.account(account).balance;;
    }

    /**
     * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - the caller must have a balance of at least `value`.
     */
    transfer(to: address, value: u64) : boolean {
        let owner = Context.get('sender');
        this._transfer(owner, to, value);
        return true;
    }

    /**
     * @dev See {IERC20-allowance}.
     */
    allowance(owner: address, spender: address) : u64 {
        return this.account(owner).getAllowance(spender);
    }

    /**
     * @dev See {IERC20-allowance}.
     */
    increaseAllowance(spender: address, addedValue: u64) : void {
        let owner = Context.get('sender');
        this.account(owner).addToAllowance(spender, addedValue);
    }

    /**
     * @dev See {IERC20-allowance}.
     */
    decreaseAllowance(spender: address, subtractedValue: u64) : void {
        let owner = Context.get('sender');
        this.account(owner).subtractFromAllowance(spender, subtractedValue);
    }
        
    /**
     * @dev See {IERC20-approve}.
     *
     * NOTE: If `value` is the maximum `u64`, the allowance is not updated on
     * `transferFrom`. This is semantically equivalent to an infinite approval.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    approve(spender: address, value: u64) : boolean {
        let owner = Context.get('sender');
        this._approve(owner, spender, value);
        return true;
    }

    /**
     * @dev See {IERC20-transferFrom}.
     *
     * Emits an {Approval} event indicating the updated allowance. This is not
     * required by the EIP. See the note at the beginning of {ERC20}.
     *
     * NOTE: Does not update the allowance if the current allowance
     * is the maximum `u64`.
     *
     * Requirements:
     *
     * - `from` and `to` cannot be the zero address.
     * - `from` must have a balance of at least `value`.
     * - the caller must have allowance for ``from``'s tokens of at least
     * `value`.
     */
    transferFrom(from: address, to: address, value: u64) : boolean {
        let spender = Context.get('sender');
        this._spendAllowance(from, spender, value);
        this._transfer(from, to, value);
        return true;
    }

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to`.
     *
     * This internal function is equivalent to {transfer}, and can be used to
     * e.g. implement automatic token fees, slashing mechanisms, etc.          
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead.
     */
    _transfer(from: address, to: address, value: u64): void {
        if (from.length === 0) {
            revert(this.ERC20InvalidSender(from));
        }
        if (to.length == 0) {
            revert(this.ERC20InvalidReceiver(to));
        }
        this._update(from, to, value);
    }

    /**
     * @dev Transfers a `value` amount of tokens from `from` to `to`, or alternatively mints (or burns) if `from`
     * (or `to`) is the zero address. All customizations to transfers, mints, and burns should be done by overriding
     * this function.
     *
     * Emits a {Transfer} event.
     */
    _update(from: address, to: address, value: u64) : void {
        if (from.length === 0) {
            // Overflow check required: The rest of the code assumes that totalSupply never overflows
            this._totalSupply += value;
        } else {
            let fromBalance = this.account(from).balance;
            if (fromBalance < value) {
                revert(this.ERC20InsufficientBalance(from, fromBalance, value));
            }            
            // Overflow not possible: value <= fromBalance <= totalSupply.
            this.account(from).balance = fromBalance - value;            
        }

        if (to.length === 0) {
            // Overflow not possible: value <= totalSupply or value <= fromBalance <= totalSupply.
            this._totalSupply -= value;
        } else {
            // Overflow not possible: balance + value is at most totalSupply, which we know fits into a u64.
            this.account(to).balance += value;
        }

        emit(this.TransferEvent(from, to, value));
    }

    /**
     * @dev Creates a `value` amount of tokens and assigns them to `account`, by transferring it from address(0).
     * Relies on the `_update` mechanism
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead.
     */
    mint(account: address, value: u64) : void {
        if (account.length === 0) {
            revert(this.ERC20InvalidReceiver(account));
        }
        this._update("", account, value);
    }

    /**
     * @dev Destroys a `value` amount of tokens from `account`, lowering the total supply.
     * Relies on the `_update` mechanism.
     *
     * Emits a {Transfer} event with `to` set to the zero address.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead
     */
    burn(account: address, value: u64) : void {
        if (account.length === 0) {
            revert(this.ERC20InvalidSender(account));
        }
        this._update(account, "", value);
    }

    /**
     * @dev Sets `value` as the allowance of `spender` over the `owner` s tokens.
     *
     * This internal function is equivalent to `approve`, and can be used to
     * e.g. set automatic allowances for certain subsystems, etc.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     *
     * Overrides to this logic should be done to the variant with an additional `boolean emitEvent` argument.
     */
    _approve(owner: address, spender: address, value: u64) : void {
        this._approveEmit(owner, spender, value, true);
    }

    /**
     * @dev Variant of {_approve} with an optional flag to enable or disable the {Approval} event.
     *
     * By default (when calling {_approve}) the flag is set to true. On the other hand, approval changes made by
     * `_spendAllowance` during the `transferFrom` operation set the flag to false. This saves gas by not emitting any
     * `Approval` event during `transferFrom` operations.
     *
     * Anyone who wishes to continue emitting `Approval` events on the`transferFrom` operation can force the flag to
     * true using the following override:
     * ```
     * function _approve(owner: address, spender: address, value: u64, boolean) internal virtual override {
     *     super._approve(owner, spender, value, true);
     * }
     * ```
     *
     * Requirements are the same as {_approve}.
     */
    _approveEmit(owner: address, spender: address, value: u64, emitEvent: boolean) : void {
        if (owner.length === 0) {
            revert(this.ERC20InvalidApprover(owner));
        }
        if (spender.length === 0) {
            revert(this.ERC20InvalidSpender(spender));
        }
        this.account(owner).addToAllowance(spender, value);
        if (emitEvent) {
            emit(this.ApprovalEvent(owner, spender, value));
        }
    }

    /**
     * @dev Updates `owner` s allowance for `spender` based on spent `value`.
     *
     * Does not update the allowance value in case of infinite allowance.
     * Revert if not enough allowance is available.
     *
     * Does not emit an {Approval} event.
     */
    _spendAllowance(owner: address, spender: address, value: u64) : void {
        let currentAllowance = this.allowance(owner, spender);
        if (currentAllowance != u64.MAX_VALUE) {
            if (currentAllowance < value) {
                revert(this.ERC20InsufficientAllowance(spender, currentAllowance, value));
            }
            this._approveEmit(owner, spender, currentAllowance - value, false);
        }
    }

    /**
     * @dev Returns the account associated with `account`.
     */
    account(account: address) : Account {
        for (let i = 0; i < this._accounts.length; i++) {
            if (this._accounts[i].owner == account) {
                return this._accounts[i];
            }
        }
        return new Account(account, 0);
    }

    /**
     * @dev Returns the account associated with `account`.
     */
    accountHolder(account: address) : boolean {
        return this.account(account).owner.length !== 0;
    }

    /**
     * @dev Creates a new account with `account` as the owner and `0` as the balance.
     */
    createAccount(account: address) : void {
        this._accounts.push(new Account(account, 0));
        emit(`Account for ${account} successfully created`);
    }
}
