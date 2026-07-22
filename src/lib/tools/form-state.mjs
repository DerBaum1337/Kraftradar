function hasInput(value) {
	return String(value ?? '').trim() !== '';
}

export function getRequiredPairState(firstValue, secondValue) {
	const required = hasInput(firstValue) || hasInput(secondValue);
	return { firstRequired: required, secondRequired: required };
}

export function getDiscountFieldState(discountType) {
	const active = discountType === 'percent' || discountType === 'fixed';
	return { required: active, disabled: !active };
}
