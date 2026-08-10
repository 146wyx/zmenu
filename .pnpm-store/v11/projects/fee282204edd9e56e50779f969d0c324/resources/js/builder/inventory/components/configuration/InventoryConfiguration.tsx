import {Form} from "react-bootstrap";
import {useState} from "react";

const InventoryConfiguration = ({inventory, updateInventory, page, setPage, maxPage}) => {

    const [error, setError] = useState('');

    const handleChange = (event) => {

        const {name, value, type, checked} = event.target;
        updateInventory(prevData => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value
        }));
    }

    const nextPage = () => {
        if (page >= maxPage) return
        setPage(page + 1)
    }

    const previousPage = () => {
        if (page <= 1) return
        setPage(page - 1)
    }

    return (
        <div>
            <div className={'d-flex justify-content-between p-3'}>
                <button className={'btn btn-secondary btn-sm'} onClick={previousPage}>
                    <i className="bi bi-caret-left-fill"></i>
                </button>
                <div>
                    第 {page} 页
                </div>
                <button className={'btn btn-secondary btn-sm'} onClick={nextPage}>
                    <i className="bi bi-caret-right-fill"></i>
                </button>
            </div>
            <div className={"inventory-builder-center-configuration p-3"}>
                <div className={"mb-3"}>
                    <Form.Group className="mb-3">
                        <Form.Label>菜单名称</Form.Label>
                        <Form.Control
                            type="text"
                            name="name"
                            value={inventory?.name ?? ''}
                            onChange={handleChange}
                            className={'rounded-1'}
                            placeholder={'菜单'}
                            isInvalid={!!error}
                        />
                        <Form.Control.Feedback type="invalid">
                            {error}
                        </Form.Control.Feedback>

                        <small className="form-text text-muted">
                            这是显示给玩家的菜单名称。请注意，不同 Minecraft 版本可能有字符数量限制；可使用颜色代码和占位符。
                        </small>

                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>菜单大小</Form.Label>
                        <Form.Select name="size" value={inventory.size} onChange={handleChange}
                                     className={'rounded-1'}>
                            <option value="9">9</option>
                            <option value="18">18</option>
                            <option value="27">27</option>
                            <option value="36">36</option>
                            <option value="45">45</option>
                            <option value="54">54</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>刷新间隔（秒）</Form.Label>
                        <Form.Control
                            type="number"
                            name="updateInterval"
                            value={inventory.updateInterval}
                            onChange={handleChange}
                            className={'rounded-1'}
                        />
                        <small className="form-text text-muted">
                            设置菜单按钮的刷新间隔（秒）。要让按钮自动刷新，需启用按钮的“自动更新”选项。更多说明请见 <a
                            href={'https://zmenu.groupez.dev/configurations/buttons'} target={'_blank'}>这里</a>。
                        </small>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Check
                            type="checkbox"
                            label="清空玩家背包"
                            name="clearInventory"
                            checked={inventory.clearInventory}
                            onChange={handleChange}
                            className={'rounded-1'}
                        />
                        <small className="form-text text-muted">
                            打开菜单时暂时清空玩家背包，并在关闭菜单时恢复。可用于显示背景图等效果，不受玩家背包物品干扰。
                        </small>
                    </Form.Group>

                </div>
            </div>
        </div>
    )
}

export default InventoryConfiguration
