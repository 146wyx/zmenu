import {Form} from "react-bootstrap";

const Lore = ({handleChange, lore}) => {

    return (
        <Form.Group className="mb-3">
            <Form.Label>物品描述</Form.Label>
            <Form.Control
                as={'textarea'}
                name="lore"
                value={lore ?? ''}
                onChange={handleChange}
                className={'rounded-1'}
                rows={10}
            />
        </Form.Group>
    )

}

export default Lore
