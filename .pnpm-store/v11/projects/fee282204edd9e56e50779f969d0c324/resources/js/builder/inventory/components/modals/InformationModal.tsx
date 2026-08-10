import {Button, Modal} from 'react-bootstrap';

const InformationModal = ({handleClose, show}) => {

    return (
        <Modal show={show} onHide={handleClose} size={'lg'}>
            <Modal.Header closeButton>
                <Modal.Title>操作说明</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>
                    <div><i className="bi bi-floppy me-1"></i>保存当前菜单。</div>
                    <div><i className="bi bi-cloud-download me-1"></i>将当前菜单导出为 YML 配置文件。</div>
                    <div><i className="bi bi-lock me-1"></i>锁定或解锁页面滚动。</div>
                    <div><i className="bi bi-info-lg me-1"></i>查看编辑器的操作说明。</div>
                </p>
                <hr/>
                <p>
                    <div className={'h5 mb-1'}>从物品栏取出物品</div>
                    <div><kbd>左键</kbd>：拾取 1 个物品。</div>
                    <div><kbd>Shift</kbd> + <kbd>左键</kbd>：拾取 64 个物品。</div>
                </p>
                <hr/>
                <p>
                    <div className={'h5 mb-1'}>将物品放入菜单</div>
                    <div><kbd>右键</kbd>：将手中的物品放入菜单。</div>
                    <div><kbd>左键</kbd>：将手中的 1 个物品放入菜单。</div>
                    <div><kbd>Esc</kbd>：清空手持物品。</div>
                    <div><kbd>左键</kbd>点击页面空白处：清空手持物品。</div>
                </p>
                <hr/>
                <p>
                    <div className={'h5 mb-1'}>在菜单中操作物品</div>
                    <div><kbd>左键</kbd>：选择一个格子；移动物品前需先选择格子。</div>
                    <div><kbd>左键</kbd>：拿起整个物品堆。</div>
                    <div><kbd>右键</kbd>：拿起一半物品。</div>
                    <div><kbd>Shift</kbd> + <kbd>左键</kbd>：同时选择多个格子。</div>
                    <div><kbd>Shift</kbd> + <kbd>上方向键</kbd>：将选中的格子向上移动。</div>
                    <div><kbd>Shift</kbd> + <kbd>下方向键</kbd>：将选中的格子向下移动。</div>
                    <div><kbd>Shift</kbd> + <kbd>右方向键</kbd>：将选中的格子向右移动。</div>
                    <div><kbd>Shift</kbd> + <kbd>左方向键</kbd>：将选中的格子向左移动。</div>
                </p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" size="sm" onClick={handleClose}>关闭</Button>
            </Modal.Footer>
        </Modal>
    );

}

export default InformationModal
