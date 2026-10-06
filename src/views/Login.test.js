/*
 * Login del agente — contrato de contenido IA-first.
 *
 * Antes mostraba "12 convs. activas", "3 en cola", "45s" y conteos por canal
 * fijos en el codigo, y un "Copiloto IA activo" que no consultaba nada. Es una
 * pantalla publica: ni metricas inventadas, ni nombres de modelos, ni la
 * version interna, ni un enlace de recuperacion que no existe.
 */
// Esta app no carga jest-dom: aserciones estandar (getBy* ya falla si no encuentra).
import { fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import Login from './Login';

jest.mock('axios');

test('presenta al copiloto con un ejemplo rotulado y sin datos inventados', () => {
  render(<Login />);
  expect(screen.getByRole('heading', { name: /Atiende con un copiloto/ })).toBeTruthy();
  expect(screen.getByText('Ejemplo')).toBeTruthy();
  const text = document.body.textContent;
  expect(text).not.toMatch(/gpt|claude|sonnet|gemini|llama|mistral|openai|anthropic|azure/i);
  expect(text).not.toMatch(/activas|en cola|T\. respuesta|IA activo|v\d+\.\d+/i);
});

test('no ofrece un enlace de recuperación que no existe; explica cómo recuperar el acceso', () => {
  render(<Login />);
  expect(screen.queryByText(/Olvidaste tu contraseña/)).toBeNull();
  expect(screen.getByText(/Pide a tu supervisor que restablezca tu contraseña/)).toBeTruthy();
});

test('los campos se encuentran por su etiqueta y el formulario valida antes de enviar', () => {
  render(<Login />);
  expect(screen.getByLabelText('Usuario')).toBeTruthy();
  expect(screen.getByLabelText('Contraseña')).toBeTruthy();
  fireEvent.submit(screen.getByLabelText('Usuario').closest('form'));
  expect(screen.getByRole('alert').textContent).toContain('Ingresa tu usuario y contraseña.');
  expect(axios.post).not.toHaveBeenCalled();
});
