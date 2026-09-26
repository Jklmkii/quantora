// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PitagorasModule } from '../presentation/modules/PitagorasModule';
import { useAppStore } from '../store/useAppStore';

describe('PitagorasModule — Teste de Integração e Renderização', () => {
  beforeEach(() => {
    useAppStore.setState({
      activeTab: 'pitagoras',
      history: [],
      settings: {
        ...useAppStore.getState().settings,
        theme: 'dark',
        language: 'pt',
        decimalPlaces: 2,
        decimalSeparator: ',',
        historyLimit: 50,
      },
    });
  });

  it('renderiza os campos padrão e calcula a hipotenusa para 3 e 4', () => {
    render(<PitagorasModule />);

    expect(screen.getByRole('heading', { name: /Teorema de Pitágoras & Trigonometria/i })).toBeDefined();
    // Default 3 e 4 dá hipotenusa 5
    expect(screen.getByText(/c = 5/i)).toBeDefined();
    expect(screen.getByText(/Passo a Passo Didático/i)).toBeDefined();
  });

  it('permite alternar modos de cálculo entre hipotenusa e catetos', () => {
    render(<PitagorasModule />);

    const btnLegB = screen.getByRole('button', { name: /Calcular Cateto \(b\)/i });
    fireEvent.click(btnLegB);

    expect(screen.getByText(/Hipotenusa c/i)).toBeDefined();
  });

  it('aplica presets notáveis (ex: 5 - 12 - 13) e atualiza os resultados', () => {
    render(<PitagorasModule />);

    const presetBtn = screen.getByRole('button', { name: /5 - 12 - 13/i });
    fireEvent.click(presetBtn);

    // Hipotenusa deve ser 13
    expect(screen.getByText(/c = 13/i)).toBeDefined();
  });

  it('salva o cálculo no histórico da aplicação', () => {
    render(<PitagorasModule />);

    const saveBtn = screen.getByRole('button', { name: /Salvar no Histórico/i });
    act(() => {
      fireEvent.click(saveBtn);
    });

    const history = useAppStore.getState().history;
    expect(history.length).toBe(1);
    expect(history[0].type).toBe('pitagoras');
    expect(history[0].title).toBe('Teorema de Pitágoras');
    expect(history[0].summary).toContain('Hipotenusa');
  });
});
