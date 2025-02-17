import { SUPPORTED_VARIANTS } from "@/interpreter/variant";
import { InstructionValidationSchema } from "@/parser/validator";
import absqOperandsValidator from "../absq_operands";
import movExtensionOperandsValidator from "../mov_extension_operands";
import noMemoryToMemoryValidator from "../no_memory_to_memory_operands";
import validMemoryOperandsValidator from "../valid_memory_operands";
import variantRegisterOperandSizeValidator from "../variant_size_operands";

const validator: InstructionValidationSchema = {
    instruction: "MOV",
    supportedVariants: [...SUPPORTED_VARIANTS],
    operand: {
        counts: [2],
        validators: [
            absqOperandsValidator,
            movExtensionOperandsValidator,
            noMemoryToMemoryValidator,
            validMemoryOperandsValidator,
            variantRegisterOperandSizeValidator,
        ],
    },
    validators: [],
};

export default validator;
