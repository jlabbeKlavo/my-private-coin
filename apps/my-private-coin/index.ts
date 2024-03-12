import { JSON, Ledger } from "@klave/sdk"
import { ERC20 } from "./token/ERC20/ERC20"
import { emit } from "./klave/types"
import { TransferInput, ApproveInput, TransferFromInput, AllowanceInput, IncreaseAllowanceInput, DecreaseAllowanceInput, MintInput, BurnInput } from "./klave/ERC20/ERC20Inputs";

const ERC20Table = "ERC20Table";

/** 
 * @query return name
 *  */
export function name(): void {    
    let erc20 = JSON.parse<ERC20>(Ledger.getTable(ERC20Table).get("ALL"));
    emit(`Name is ${erc20.name()}`);    
}

/** 
 * @query return symbol
 *  */
export function symbol(): void {    
    let erc20 = JSON.parse<ERC20>(Ledger.getTable(ERC20Table).get("ALL"));
    emit(`Symbol is ${erc20.symbol()}`);    
}

/** 
 * @query return symbol
 *  */
export function decimals(): void {    
    let erc20 = JSON.parse<ERC20>(Ledger.getTable(ERC20Table).get("ALL"));
    emit(`Symbol is ${erc20.decimals()}`);    
}

/** 
 * @query return total supply of the currency
 *  */
export function totalSupply(): void {    
    let erc20 = JSON.parse<ERC20>(Ledger.getTable(ERC20Table).get("ALL"));
    emit(`Total Supply is ${erc20.totalSupply()}`);    
}

/** 
 * @query return balances of the currency
 * @param {string} owner - the address of the owner, takes the sender's address if not provided
 *  */
export function balanceOf(owner: string): void {
    let erc20 = JSON.parse<ERC20>(Ledger.getTable(ERC20Table).get("ALL"));
    emit(`Balance for ${owner} is ${erc20.balanceOf(owner)}`);    
}

/** 
 * @transaction 
 * @param {TransferInput} - A parsed input argument containing the "to" address and the value to be paid
 *  */
export function transfer(input: TransferInput): void {
    let erc20 = JSON.parse<ERC20>(Ledger.getTable(ERC20Table).get("ALL"));
    erc20.transfer(input.to, input.value);
    Ledger.getTable(ERC20Table).set("ALL", JSON.stringify<ERC20>(erc20));
}

/** 
 * @transaction
 * @param {ApproveInput} - A parsed input argument containing the address of the spender and the value to be credited
 *  */
export function approve(input: ApproveInput): void {
    let erc20 = JSON.parse<ERC20>(Ledger.getTable(ERC20Table).get("ALL"));
    erc20.approve(input.spender, input.value);
    Ledger.getTable(ERC20Table).set("ALL", JSON.stringify<ERC20>(erc20));
}

/** 
 * @transaction
 * @param {TransferFromInput} - A parsed input argument containing the "from" address, the "to" address and the value to be transferred
 *  */
export function transferFrom(input: TransferFromInput): void {
    let erc20 = JSON.parse<ERC20>(Ledger.getTable(ERC20Table).get("ALL"));
    erc20.transferFrom(input.from, input.to, input.value);
    Ledger.getTable(ERC20Table).set("ALL", JSON.stringify<ERC20>(erc20));
}

/** 
 * @query 
 * @param {AllowanceInput} - A parsed input argument containing the address of the owner and the address of the spender
 *  */
export function allowance(input: AllowanceInput): void {
    let erc20 = JSON.parse<ERC20>(Ledger.getTable(ERC20Table).get("ALL"));
    erc20.allowance(input.owner, input.spender);    
}

/**
 * @transaction increase the amount which spender is still allowed to withdraw from owner
 * @param {IncreaseAllowanceInput} - A parsed input argument containing the address of the spender and the amount to be added
 */
export function increaseAllowance(input: IncreaseAllowanceInput): void {
    let erc20 = JSON.parse<ERC20>(Ledger.getTable(ERC20Table).get("ALL"));
    erc20.increase_allowance(input.spender, input.addedValue);
    Ledger.getTable(ERC20Table).set("ALL", JSON.stringify<ERC20>(erc20));
}

/**
 * @transaction decrease the amount which spender is still allowed to withdraw from owner
 * @param {DecreaseAllowanceInput} - A parsed input argument containing the address of the spender and the amount to be subtracted
 */
export function decreaseAllowance(input: DecreaseAllowanceInput): void {
    let erc20 = JSON.parse<ERC20>(Ledger.getTable(ERC20Table).get("ALL"));    
    erc20.decrease_allowance(input.spender, input.subtractedValue);
    Ledger.getTable(ERC20Table).set("ALL", JSON.stringify<ERC20>(erc20));
}

/**
 * @transaction create new tokens and assign them to the specified address
 * @param {MintInput} - A parsed input argument containing the address of the recipient and the amount of tokens to be created
 */
export function mint(input: MintInput): void {
    let erc20 = JSON.parse<ERC20>(Ledger.getTable(ERC20Table).get("ALL"));    
    erc20.mint(input.to, input.value);
    Ledger.getTable(ERC20Table).set("ALL", JSON.stringify<ERC20>(erc20));
}

/**
 * @transaction Destroy tokens from the specified address
 * @param {BurnInput} - A parsed input argument containing the address of the sender and the amount of tokens to be destroyed
 */
export function burn(input: BurnInput): void {
    let erc20 = JSON.parse<ERC20>(Ledger.getTable(ERC20Table).get("ALL"));    
    erc20.burn(input.from, input.value);
    Ledger.getTable(ERC20Table).set("ALL", JSON.stringify<ERC20>(erc20));
}
