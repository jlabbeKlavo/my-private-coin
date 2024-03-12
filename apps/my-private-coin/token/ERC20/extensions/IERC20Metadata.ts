
import {IERC20} from "../IERC20";

/**
 * @dev Interface for the optional metadata functions from the ERC20 standard.
 */
export interface IERC20Metadata extends IERC20 {
    /**
     * @dev Returns the name of the token.
     */
    name() : string;

    /**
     * @dev Returns the symbol of the token.
     */    
    symbol() : string;

    /**
     * @dev Returns the decimals places of the token.
     */
    decimals() : string;
}
