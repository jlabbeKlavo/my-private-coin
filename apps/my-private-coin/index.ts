import { JSON, Ledger } from "@klave/sdk"
import { ERC20 } from "./token/ERC20/ERC20"
import { emit } from "./klave/types"
import { CreateInput, TransferInput, ApproveInput, TransferFromInput, AllowanceInput, IncreaseAllowanceInput, DecreaseAllowanceInput, MintInput, BurnInput } from "./klave/ERC20/ERC20Inputs";

const ERC20Table = "ERC20Table";

const _loadERC20 = function(): ERC20 {
    let erc20_table = Ledger.getTable(ERC20Table).get("ALL");
    if (erc20_table.length === 0) {
        emit("Coin does not exists. Create it first");
        return new ERC20("", "", 0, 0);
    }    
    return JSON.parse<ERC20>(erc20_table);
}

const _saveERC20 = function(erc20 : ERC20): void {
    Ledger.getTable(ERC20Table).set("ALL", JSON.stringify<ERC20>(erc20));
}

/** 
 * @transaction 
 * @param {CreateInput} - A parsed input argument containing the name, symbol, decimals and total supply of the currency
 *  */
export function create(input: CreateInput): void {    
    let erc20_table = Ledger.getTable(ERC20Table).get("ALL");
    if (erc20_table.length !== 0) {
        emit("Coin already exists");
        return;
    }
    emit("Coin does not exist yet, creating it");
    let erc20 = new ERC20(input.name, input.symbol, input.decimals, input.totalSupply);    
    Ledger.getTable(ERC20Table).set("ALL", JSON.stringify<ERC20>(erc20));
    emit("Coin created successfully");
}

/** 
 * @query return name
 *  */
export function name(): void {    
    let erc20 = _loadERC20();
    emit(`Name is ${erc20.name()}`);    
}

/** 
 * @query return symbol
 *  */
export function symbol(): void {    
    let erc20 = _loadERC20();
    emit(`Symbol is ${erc20.symbol()}`);    
}

/** 
 * @query return symbol
 *  */
export function decimals(): void {    
    let erc20 = _loadERC20();
    emit(`Symbol is ${erc20.decimals()}`);    
}

/** 
 * @query return total supply of the currency
 *  */
export function totalSupply(): void {    
    let erc20 = _loadERC20();
    emit(`Total Supply is ${erc20.totalSupply()}`);    
}

/** 
 * @query return balances of the currency
 * @param {string} owner - the address of the owner, takes the sender's address if not provided
 *  */
export function balanceOf(owner: string): void {
    let erc20 = _loadERC20();
    emit(`Balance for ${owner} is ${erc20.balanceOf(owner)}`);    
}

/** 
 * @transaction 
 * @param {TransferInput} - A parsed input argument containing the "to" address and the value to be paid
 *  */
export function transfer(input: TransferInput): void {
    let erc20 = _loadERC20();
    erc20.transfer(input.to, input.value);
    _saveERC20(erc20);
}

/** 
 * @transaction
 * @param {ApproveInput} - A parsed input argument containing the address of the spender and the value to be credited
 *  */
export function approve(input: ApproveInput): void {
    let erc20 = _loadERC20();
    erc20.approve(input.spender, input.value);
    _saveERC20(erc20);
}

/** 
 * @transaction
 * @param {TransferFromInput} - A parsed input argument containing the "from" address, the "to" address and the value to be transferred
 *  */
export function transferFrom(input: TransferFromInput): void {
    let erc20 = _loadERC20();
    erc20.transferFrom(input.from, input.to, input.value);
    _saveERC20(erc20);
}

/** 
 * @query 
 * @param {AllowanceInput} - A parsed input argument containing the address of the owner and the address of the spender
 *  */
export function allowance(input: AllowanceInput): void {
    let erc20 = _loadERC20();
    erc20.allowance(input.owner, input.spender);    
}

/**
 * @transaction increase the amount which spender is still allowed to withdraw from owner
 * @param {IncreaseAllowanceInput} - A parsed input argument containing the address of the spender and the amount to be added
 */
export function increaseAllowance(input: IncreaseAllowanceInput): void {
    let erc20 = _loadERC20();
    erc20.increaseAllowance(input.spender, input.addedValue);
    _saveERC20(erc20);
}

/**
 * @transaction decrease the amount which spender is still allowed to withdraw from owner
 * @param {DecreaseAllowanceInput} - A parsed input argument containing the address of the spender and the amount to be subtracted
 */
export function decreaseAllowance(input: DecreaseAllowanceInput): void {
    let erc20 = _loadERC20();
    erc20.decreaseAllowance(input.spender, input.subtractedValue);
    _saveERC20(erc20);
}

/**
 * @transaction create new tokens and assign them to the specified address
 * @param {MintInput} - A parsed input argument containing the address of the recipient and the amount of tokens to be created
 */
export function mint(input: MintInput): void {
    let erc20 = _loadERC20();
    erc20.mint(input.to, input.value);
    _saveERC20(erc20);
}

/**
 * @transaction Destroy tokens from the specified address
 * @param {BurnInput} - A parsed input argument containing the address of the sender and the amount of tokens to be destroyed
 */
export function burn(input: BurnInput): void {
    let erc20 = JSON.parse<ERC20>(Ledger.getTable(ERC20Table).get("ALL"));    
    erc20.burn(input.from, input.value);
    _saveERC20(erc20);
}
