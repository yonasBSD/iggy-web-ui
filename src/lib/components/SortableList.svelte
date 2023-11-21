<script lang="ts" context="module">
  type ListItem = {
    id: string | number;
  };
  type Ordering<T> = { key: keyof T; asc: boolean } | { key: undefined; asc: undefined };

  function orderData<T>(data: T[], key: keyof T, asc: boolean) {
    return data.sort((a, b) => {
      if (a[key] > b[key]) return asc ? 1 : -1;
      else if (a[key] < b[key]) return asc ? -1 : 1;
      return 0;
    });
  }
</script>

<script lang="ts" generics="T extends ListItem">
  import { asConst } from '$lib/utils/asConst';

  import { afterNavigate, beforeNavigate } from '$app/navigation';

  import { slide } from 'svelte/transition';

  import DropdownMenu from './DropdownMenu.svelte';
  import type { ComponentProps, ComponentType } from 'svelte';
  import Icon from './Icon.svelte';
  import Button from './Button.svelte';
  import Checkbox from './Checkbox.svelte';
  import StopPropagationWrapper from './StopPropagationWrapper.svelte';
  import { twMerge } from 'tailwind-merge';
  import { createEventDispatcher, onMount } from 'svelte';
  import { noTypeCheck } from '$lib/utils/noTypeCheck';

  export let data: T[];
  export let emptyDataMessage: string;
  export let colNames: Record<keyof T, string>;
  export let rowClass: string;
  export let areRowsSelectable: boolean | undefined = false;
  export let disabledIds: T['id'][] = [];

  let animationEnabled = true;

  // if($page.nav)

  beforeNavigate(() => {
    animationEnabled = false;
    console.log('before navigate');
  });

  afterNavigate(() => {
    setTimeout(() => {
      animationEnabled = true;
    }, 500);
  });

  export let hrefBuilder: ((item: T) => string) | undefined = undefined;
  export let actions: ComponentProps<InstanceType<typeof DropdownMenu>>['itemGroups'] | undefined =
    undefined;

  const dispatch = createEventDispatcher<{ selection: { items: T[] } }>();

  let ordering: Ordering<T> = {
    key: undefined,
    asc: undefined
  };

  $: columns = Object.entries(colNames).map(([key, value]) => ({
    columnDisplayedName: value,
    columnName: key
  })) as { columnDisplayedName: string; columnName: keyof T }[];

  $: orderedData = ordering.key ? orderData(data, ordering.key, ordering.asc!) : data;

  let selectedItems: string[] = [];

  $: dispatch('selection', {
    items: data.filter((item) => selectedItems.includes(item.id.toString()))
  });

  const toggleAllChecked = (e: Event) => {
    const { checked } = e.target as HTMLInputElement;
    selectedItems = checked ? data.map((item) => `${item.id}`) : [];
  };

  let isBodyOverflowing = false;
  let bodyElem: HTMLDivElement | null = null;
  $: if (bodyElem && bodyElem.scrollHeight > bodyElem.offsetHeight) {
    isBodyOverflowing = true;
  }
</script>

<div class="overflow-auto flex-1">
  <!-- header -->
  <div
    class={twMerge(
      'flex h-[60px] min-h-[60px] bg-shadeL300 dark:bg-shadeD400 min-w-[1300px]',
      isBodyOverflowing && 'pr-5'
    )}
  >
    {#if areRowsSelectable}
      <div class="w-[100px] flex items-center justify-center">
        <Checkbox
          on:change={toggleAllChecked}
          checked={selectedItems.length === data.length - disabledIds.length}
          value="all"
          name="checkAll"
        />
      </div>
    {/if}

    <div class="w-full {rowClass}">
      {#each columns as { columnName, columnDisplayedName } (columnName)}
        <button
          on:click={() =>
            (ordering = {
              key: columnName,
              asc: ordering.key !== columnName ? true : !ordering.asc
            })}
          class="flex items-center px-5 hover:cursor-pointer hover:bg-shadeL400 dark:hover:bg-shadeD200 dark:text-white justify-between outline-none focus:outline-none focus-visible:ring ring-inset ring-blue-600/60 transition-colors"
        >
          <span>
            {columnDisplayedName}
          </span>

          <div class="flex flex-col">
            {#each asConst(['caretUp', 'caretDown']) as icon}
              <Icon
                name={icon}
                class={twMerge(
                  'fill-shadeL800 stroke-shadeL800 dark:fill-shadeL900 dark:stroke-shadeL900 w-[18px] h-fit -mb-[4px] -my-[2px]',
                  ordering.key === columnName &&
                    ordering.asc &&
                    icon === 'caretUp' &&
                    ' stroke-black  fill-black dark:stroke-white dark:fill-white',
                  ordering.key === columnName &&
                    !ordering.asc &&
                    icon === 'caretDown' &&
                    ' stroke-black fill-black dark:stroke-white dark:fill-white'
                )}
              />
            {/each}
          </div>
        </button>
      {/each}
    </div>

    {#if actions}
      <div class="flex items-center justify-center px-5 w-[100px] mr-12">Actions</div>
    {/if}
  </div>

  <!-- body -->
  <div class="min-w-[1300px] h-[calc(100%-60px)] pb-3 overflow-auto" bind:this={bodyElem}>
    {#if data.length === 0}
      <div class="flex items-center justify-center text-gray-400 mt-14 text-lg">
        <em>{emptyDataMessage}</em>
      </div>
    {/if}

    {#each orderedData as item (item.id)}
      {@const rowDisabled = disabledIds.includes(item.id)}
      <svelte:element
        this={hrefBuilder ? 'a' : 'label'}
        href={hrefBuilder && hrefBuilder(item)}
        on:introstart={noTypeCheck((e) => {
          e.target.style.backgroundColor = 'rgb(74, 222, 128)';
        })}
        on:introend={(e) => {
          setTimeout(
            () => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.transitionDuration = '500ms';
            },
            animationEnabled ? 800 : 0
          );
        }}
        on:outrostart={(e) => (e.target.style.backgroundColor = 'rgb(239 68 68)')}
        in:slide={{ duration: animationEnabled ? 300 : 0 }}
        out:slide={{ duration: animationEnabled ? 300 : 0, delay: animationEnabled ? 800 : 0 }}
        class={twMerge(
          'flex flex-row h-[65px] border-b hover:cursor-pointer dark:text-white',
          selectedItems.includes(item.id.toString()) ? 'bg-green100' : 'hoverable  ',
          rowDisabled && 'bg-shadeL400 text-shadeL900 pointer-events-none '
        )}
      >
        {#if areRowsSelectable}
          <div class="w-[100px] flex items-center justify-center">
            {#if rowDisabled}
              <Checkbox value={item.id.toString()} checked={false} />
            {:else}
              <Checkbox value={item.id.toString()} bind:bindGroup={selectedItems} />
            {/if}
          </div>
        {/if}
        <div class="flex items-center w-full {rowClass}">
          <slot {item}>
            {#each columns as { columnName }, idx (idx)}
              <div class={twMerge('px-5')}>
                <span class={columnName === 'id' ? 'font-semibold' : ''}>
                  {item[columnName]}
                </span>
              </div>
            {/each}
          </slot>
        </div>

        {#if actions}
          <StopPropagationWrapper class="flex items-center justify-center w-[100px] mr-12">
            <DropdownMenu itemGroups={actions} placement="left-start">
              <Button variant="rounded" class="">
                <Icon name="verticalDots" />
              </Button>
            </DropdownMenu>
          </StopPropagationWrapper>
        {/if}
      </svelte:element>
    {/each}
  </div>
</div>