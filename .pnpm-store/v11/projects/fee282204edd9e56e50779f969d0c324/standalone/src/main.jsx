import ReactDOM from 'react-dom/client';
import InventoryBuilder from '../../resources/js/builder/inventory/InventoryBuilder';
import api from '../../resources/js/builder/services/api';
import './standalone.scss';
import 'bootstrap-icons/font/bootstrap-icons.css';

window.Content = api.loadEditorContent();

window.toast = (type, title, description) => {
    console[type === 'error' ? 'error' : 'info'](`${title}: ${description}`);
};

ReactDOM.createRoot(document.getElementById('builder')).render(<InventoryBuilder />);
